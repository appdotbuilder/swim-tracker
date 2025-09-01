import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trophy } from 'lucide-react';
import type { StrokeType } from '../../../server/src/schema';
import type { PracticeStatistics as PracticeStatsType } from '../../../server/src/handlers/get_practice_statistics';

interface PracticeStatisticsProps {
  statistics: PracticeStatsType | null;
}

const strokeEmojis: Record<StrokeType, string> = {
  'Freestyle': '🏊‍♀️',
  'Breaststroke': '🐸',
  'Backstroke': '🏊‍♂️',
  'Butterfly': '🦋',
  'IM': '🏆'
};

export function PracticeStatistics({ statistics }: PracticeStatisticsProps) {
  if (!statistics || statistics.total_practices === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 text-purple-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No statistics available yet</p>
        <p className="text-gray-400">Complete some practices to see your progress! 📊</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {statistics.total_practices}
            </div>
            <div className="text-sm text-gray-600">Total Practices</div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {statistics.total_distance.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Distance</div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.round(statistics.total_time_minutes / 60)}h
            </div>
            <div className="text-sm text-gray-600">Total Time</div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {Math.round(statistics.average_distance_per_practice)}
            </div>
            <div className="text-sm text-gray-600">Avg Distance</div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Stroke Distribution */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Stroke Distribution</h3>
        <div className="space-y-3">
          {Object.entries(statistics.stroke_distribution).map(([stroke, count]) => (
            <div key={stroke} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{strokeEmojis[stroke as StrokeType]}</span>
                <span className="font-medium text-gray-700">{stroke}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${statistics.total_practices > 0 ? (count / statistics.total_practices) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-8 text-right">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {statistics.most_common_stroke && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <p className="text-center text-gray-700">
              <span className="text-xl mr-2">{strokeEmojis[statistics.most_common_stroke]}</span>
              <strong>{statistics.most_common_stroke}</strong> is your most practiced stroke!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}