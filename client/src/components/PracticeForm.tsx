import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Timer } from 'lucide-react';
import { useState } from 'react';
import type { CreateSwimmingPracticeInput, StrokeType } from '../../../server/src/schema';

interface PracticeFormProps {
  onSubmit: (data: CreateSwimmingPracticeInput) => Promise<void>;
  isLoading?: boolean;
}

const strokeEmojis: Record<StrokeType, string> = {
  'Freestyle': '🏊‍♀️',
  'Breaststroke': '🐸',
  'Backstroke': '🏊‍♂️',
  'Butterfly': '🦋',
  'IM': '🏆'
};

// Utility function for className merging
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Date formatting utility
const format = (date: Date, formatStr: string) => {
  if (formatStr === "PPP") {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  return date.toLocaleDateString();
};

export function PracticeForm({ onSubmit, isLoading = false }: PracticeFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [formData, setFormData] = useState<CreateSwimmingPracticeInput>({
    date: new Date(),
    duration_minutes: 60,
    total_distance: 1000,
    main_stroke: 'Freestyle',
    notes: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      date: new Date(),
      duration_minutes: 60,
      total_distance: 1000,
      main_stroke: 'Freestyle',
      notes: null
    });
    setSelectedDate(new Date());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData((prev: CreateSwimmingPracticeInput) => ({ ...prev, date }));
    }
    setIsCalendarOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-gray-700 font-medium">Practice Date</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-blue-200",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Main Stroke */}
        <div className="space-y-2">
          <Label htmlFor="stroke" className="text-gray-700 font-medium">Main Stroke</Label>
          <Select
            value={formData.main_stroke}
            onValueChange={(value: StrokeType) =>
              setFormData((prev: CreateSwimmingPracticeInput) => ({ ...prev, main_stroke: value }))
            }
          >
            <SelectTrigger className="border-blue-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(strokeEmojis).map(([stroke, emoji]) => (
                <SelectItem key={stroke} value={stroke}>
                  <div className="flex items-center gap-2">
                    <span>{emoji}</span>
                    <span>{stroke}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-gray-700 font-medium">
            Duration (minutes)
          </Label>
          <Input
            id="duration"
            type="number"
            placeholder="60"
            value={formData.duration_minutes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateSwimmingPracticeInput) => ({ 
                ...prev, 
                duration_minutes: parseInt(e.target.value) || 0 
              }))
            }
            min="1"
            required
            className="border-blue-200 focus:border-blue-400"
          />
        </div>

        {/* Total Distance */}
        <div className="space-y-2">
          <Label htmlFor="distance" className="text-gray-700 font-medium">
            Total Distance (meters/yards)
          </Label>
          <Input
            id="distance"
            type="number"
            placeholder="1000"
            value={formData.total_distance}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateSwimmingPracticeInput) => ({ 
                ...prev, 
                total_distance: parseFloat(e.target.value) || 0 
              }))
            }
            step="0.01"
            min="0"
            required
            className="border-blue-200 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-gray-700 font-medium">
          Additional Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          placeholder="How did the practice feel? Any specific drills or techniques worked on..."
          // Handle nullable field with fallback to empty string
          value={formData.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateSwimmingPracticeInput) => ({
              ...prev,
              notes: e.target.value || null // Convert empty string back to null
            }))
          }
          className="border-blue-200 focus:border-blue-400 min-h-[100px]"
        />
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 ripple"
      >
        {isLoading ? 'Recording Practice...' : '🏊‍♀️ Record Practice'}
      </Button>
    </form>
  );
}