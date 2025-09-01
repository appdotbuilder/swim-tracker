import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Waves, Timer, Ruler, TrendingUp } from 'lucide-react';
import type { SwimmingPractice, StrokeType } from '../../../server/src/schema';

interface PracticeHistoryProps {
  practices: SwimmingPractice[];
}

const strokeEmojis: Record<StrokeType, string> = {
  'Freestyle': '🏊‍♀️',
  'Breaststroke': '🐸',
  'Backstroke': '🏊‍♂️',
  'Butterfly': '🦋',
  'IM': '🏆'
};

const strokeColors: Record<StrokeType, string> = {
  'Freestyle': 'bg-blue-100 text-blue-800 border-blue-300',
  'Breaststroke': 'bg-green-100 text-green-800 border-green-300',
  'Backstroke': 'bg-purple-100 text-purple-800 border-purple-300',
  'Butterfly': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'IM': 'bg-red-100 text-red-800 border-red-300'
};

// Date formatting utility
const format = (date: Date, formatStr: string) => {
  if (formatStr === "EEEE, MMMM do, yyyy") {
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                  day === 2 || day === 22 ? 'nd' : 
                  day === 3 || day === 23 ? 'rd' : 'th';
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).replace(/\d+/, `${day}${suffix}`);
  }
  if (formatStr === "MM/dd/yy") {
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    });
  }
  return date.toLocaleDateString();
};

export function PracticeHistory({ practices }: PracticeHistoryProps) {
  if (practices.length === 0) {
    return (
      <div className="text-center py-12">
        <Waves className="h-16 w-16 text-blue-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No practices recorded yet</p>
        <p className="text-gray-400">Start by logging your first swimming practice! 🏊‍♀️</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {practices.map((practice: SwimmingPractice) => (
        <Card key={practice.id} className="border-l-4 border-l-blue-400 hover:shadow-md transition-shadow float">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {strokeEmojis[practice.main_stroke]}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    {practice.main_stroke} Practice
                  </h3>
                  <p className="text-gray-600">
                    {format(new Date(practice.date), "EEEE, MMMM do, yyyy")}
                  </p>
                </div>
              </div>
              <Badge className={strokeColors[practice.main_stroke]} variant="outline">
                {practice.main_stroke}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Timer className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{practice.duration_minutes} min</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Ruler className="h-4 w-4 text-green-600" />
                <span className="font-medium">{practice.total_distance.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="font-medium">
                  {Math.round(practice.total_distance / practice.duration_minutes)} /min
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Logged: {format(new Date(practice.created_at), "MM/dd/yy")}
              </div>
            </div>
            
            {/* Handle nullable notes */}
            {practice.notes && (
              <div className="bg-blue-50 rounded-lg p-3 border-l-2 border-blue-300">
                <p className="text-gray-700 italic">"{practice.notes}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}