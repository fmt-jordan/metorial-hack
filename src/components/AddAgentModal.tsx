import { useState, useEffect } from 'react';
import { X, ChevronRight, Bot, Loader2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAgent } from '../contexts/AgentContext';

interface VapiAssistant {
  id: string;
  name: string;
}

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Provider = 'vapi' | 'lindy' | 'aircall' | null;

export default function AddAgentModal({ isOpen, onClose }: AddAgentModalProps) {
  const { refreshAssistants } = useAgent();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProvider, setSelectedProvider] = useState<Provider>(null);
  const [availableAssistants, setAvailableAssistants] = useState<VapiAssistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [selectedAssistantId, setSelectedAssistantId] = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [assistantDescription, setAssistantDescription] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedProvider(null);
      setSelectedAssistantId('');
      setAssistantName('');
      setAssistantDescription('');
      setProfileImage(null);
      setProfileImagePreview('');
      setError('');
    }
  }, [isOpen]);

  const fetchVapiAssistants = async () => {
    setLoadingAssistants(true);
    setError('');
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const apiUrl = `${supabaseUrl}/functions/v1/vapi-assistants`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch assistants from Vapi');
      }

      const assistants = await response.json();

      const { data: existingAssistants } = await supabase
        .from('assistants')
        .select('assistant_id');

      const existingIds = new Set(existingAssistants?.map(a => a.assistant_id) || []);

      const available = assistants
        .filter((a: VapiAssistant) => !existingIds.has(a.id))
        .map((a: VapiAssistant) => ({
          id: a.id,
          name: a.name || 'Unnamed Assistant',
        }));

      setAvailableAssistants(available);
    } catch (err: any) {
      console.error('Error fetching Vapi assistants:', err);
      setError(err.message || 'Failed to load assistants from Vapi.');
    } finally {
      setLoadingAssistants(false);
    }
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    if (provider === 'vapi') {
      setStep(2);
      fetchVapiAssistants();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!selectedAssistantId || !assistantName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      let profileImageUrl = '';

      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${selectedAssistantId}-${Date.now()}.${fileExt}`;
        const filePath = `assistant-profiles/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public')
          .upload(filePath, profileImage);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('public')
            .getPublicUrl(filePath);
          profileImageUrl = publicUrl;
        }
      }

      const { error: insertError } = await supabase
        .from('assistants')
        .insert({
          assistant_id: selectedAssistantId,
          name: assistantName,
          description: assistantDescription,
          profile_image_url: profileImageUrl,
          is_active: true,
        });

      if (insertError) {
        throw insertError;
      }

      await refreshAssistants();
      onClose();
    } catch (err: any) {
      console.error('Error creating assistant:', err);
      setError(err.message || 'Failed to create assistant');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white text-xl font-bold">Add New Agent</h2>
            <p className="text-cyan-100 text-sm">
              {step === 1 ? 'Step 1: Select Provider' : 'Step 2: Configure Assistant'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm mb-6">
                Choose your AI voice agent provider to get started
              </p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleProviderSelect('vapi')}
                  className="h-24 bg-black border-2 border-slate-700 hover:border-cyan-500 rounded-lg transition-all duration-200 hover:scale-[1.02] p-4 flex items-center justify-center"
                >
                  <img src="/images/platforms/vapi.png" alt="Vapi" className="h-full w-auto object-contain" />
                </button>

                <button  
                  className="h-24 bg-black border-2 border-slate-700 hover:border-cyan-500 rounded-lg transition-all duration-200 hover:scale-[1.02] p-4 flex items-center justify-center"                >
                  <img src="/images/platforms/lindy.png" alt="Lindy" className="h-full w-auto object-contain" />
                </button>

                <button  
                  className="h-24 bg-black border-2 border-slate-700 hover:border-cyan-500 rounded-lg transition-all duration-200 hover:scale-[1.02] p-4 flex items-center justify-center"                >
                  <img src="/images/platforms/aircall.png" alt="Aircall" className="h-full w-auto object-contain" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {loadingAssistants ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Assistant ID <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={selectedAssistantId}
                      onChange={(e) => setSelectedAssistantId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Select an assistant from Vapi</option>
                      {availableAssistants.map((assistant) => (
                        <option key={assistant.id} value={assistant.id}>
                          {assistant.name} ({assistant.id})
                        </option>
                      ))}
                    </select>
                    {availableAssistants.length === 0 && !loadingAssistants && (
                      <p className="text-slate-500 text-xs mt-1">
                        No available assistants found. All Vapi assistants may already be added.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Assistant Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={assistantName}
                      onChange={(e) => setAssistantName(e.target.value)}
                      placeholder="e.g., Sales Assistant"
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={assistantDescription}
                      onChange={(e) => setAssistantDescription(e.target.value)}
                      placeholder="Brief description of the assistant's role..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Profile Image
                    </label>
                    <div className="flex items-center gap-4">
                      {profileImagePreview && (
                        <img
                          src={profileImagePreview}
                          alt="Preview"
                          className="w-16 h-16 rounded-lg object-cover border-2 border-slate-700"
                        />
                      )}
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg hover:border-cyan-500 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400 text-sm">
                          {profileImage ? profileImage.name : 'Upload image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={isCreating || !selectedAssistantId || !assistantName.trim()}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Agent'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
