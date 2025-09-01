import './App.css';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Waves, Timer, Trophy } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { PracticeForm } from '@/components/PracticeForm';
import { PracticeHistory } from '@/components/PracticeHistory';
import { PracticeStatistics } from '@/components/PracticeStatistics';
// Using type-only imports for better TypeScript compliance
import type { SwimmingPractice, CreateSwimmingPracticeInput } from '../../server/src/schema';
import type { PracticeStatistics as PracticeStatsType } from '../../server/src/handlers/get_practice_statistics';

function App() {
  // Explicit typing with SwimmingPractice interface
  const [practices, setPractices] = useState<SwimmingPractice[]>([]);
  const [statistics, setStatistics] = useState<PracticeStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // useCallback to memoize functions used in useEffect
  const loadPractices = useCallback(async () => {
    try {
      const result = await trpc.getSwimmingPractices.query();
      setPractices(result);
    } catch (error) {
      console.error('Failed to load practices:', error);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const result = await trpc.getPracticeStatistics.query();
      setStatistics(result);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, []);

  // useEffect with proper dependencies
  useEffect(() => {
    loadPractices();
    loadStatistics();
  }, [loadPractices, loadStatistics]);

  const handleCreatePractice = async (formData: CreateSwimmingPracticeInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createSwimmingPractice.mutate(formData);
      // Update practices list with explicit typing in setState callback
      setPractices((prev: SwimmingPractice[]) => [response, ...prev]);
      // Reload statistics after adding new practice
      await loadStatistics();
    } catch (error) {
      console.error('Failed to create practice:', error);
      throw error; // Re-throw to let form handle the error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Waves className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Swimming Practice Tracker</h1>
            <Waves className="h-8 w-8 text-blue-600 scale-x-[-1]" />
          </div>
          <p className="text-lg text-gray-600">Track your swimming sessions and improve your performance 🏊‍♀️</p>
        </div>

        <Tabs defaultValue="log-practice" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur">
            <TabsTrigger value="log-practice" className="data-[state=active]:bg-blue-100">Log Practice</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-100">Practice History</TabsTrigger>
            <TabsTrigger value="statistics" className="data-[state=active]:bg-blue-100">Statistics</TabsTrigger>
          </TabsList>

          {/* Log Practice Tab */}
          <TabsContent value="log-practice">
            <Card className="bg-white/80 backdrop-blur border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Log New Practice Session
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Record your swimming practice details
                </CardDescription>
              </CardHeader>
              <div className="p-6">
                <PracticeForm onSubmit={handleCreatePractice} isLoading={isLoading} />
              </div>
            </Card>
          </TabsContent>

          {/* Practice History Tab */}
          <TabsContent value="history">
            <Card className="bg-white/80 backdrop-blur border-blue-200">
              <CardHeader className="bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5" />
                  Practice History
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Review your swimming practice sessions
                </CardDescription>
              </CardHeader>
              <div className="p-6">
                <PracticeHistory practices={practices} />
              </div>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <Card className="bg-white/80 backdrop-blur border-blue-200">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Practice Statistics
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Track your swimming progress and performance
                </CardDescription>
              </CardHeader>
              <div className="p-6">
                <PracticeStatistics statistics={statistics} />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;