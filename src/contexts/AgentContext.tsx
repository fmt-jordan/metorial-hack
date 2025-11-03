import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Assistant {
  id: string;
  assistant_id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_image_url?: string;
}

interface AgentContextType {
  assistants: Assistant[];
  selectedAssistant: Assistant | null;
  setSelectedAssistant: (assistant: Assistant | null) => void;
  isLoading: boolean;
  refreshAssistants: () => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssistants = async () => {
    try {
      const { data, error } = await supabase
        .from('assistants')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setAssistants(data || []);

      if (data && data.length > 0 && !selectedAssistant) {
        setSelectedAssistant(data[0]);
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssistants();
  }, []);

  const refreshAssistants = async () => {
    setIsLoading(true);
    await fetchAssistants();
  };

  return (
    <AgentContext.Provider
      value={{
        assistants,
        selectedAssistant,
        setSelectedAssistant,
        isLoading,
        refreshAssistants,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}
