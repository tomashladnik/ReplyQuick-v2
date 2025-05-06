'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { toast } from "react-hot-toast";


const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' }
];

const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 17   // 5 PM
};

export function ScheduleModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    startTime: '',
    endTime: '',
    timezone: 'America/New_York',
    attendees: '',
    description: ''
  });

  const [timeError, setTimeError] = useState('');

  const validateTime = (startTime, endTime, timezone) => {
    if (!startTime || !endTime) return true;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      setTimeError('End time must be after start time');
      return false;
    }

    const startHour = start.getHours();
    const endHour = end.getHours();

    if (startHour < BUSINESS_HOURS.start || endHour > BUSINESS_HOURS.end) {
      setTimeError(`Meetings must be scheduled between ${BUSINESS_HOURS.start} AM and ${BUSINESS_HOURS.end} PM`);
      return false;
    }

    setTimeError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!validateTime(formData.startTime, formData.endTime, formData.timezone)) {
        setLoading(false);
        return;
      }

      const attendees = formData.attendees.split(',').map(email => email.trim());
      
      // Convert local time (from input) in selected timezone to UTC
      const startTimeUTC = DateTime.fromISO(formData.startTime, { zone: formData.timezone }).toUTC().toISO();
      const endTimeUTC = DateTime.fromISO(formData.endTime, { zone: formData.timezone }).toUTC().toISO();
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startTime: startTimeUTC,
          endTime: endTimeUTC,
          timezone: formData.timezone,
          attendees
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule meeting');
      }

      const data = await response.json();
      toast.success('Meeting scheduled successfully!');
      onSuccess(data.booking);
      onClose();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error(error.message || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'startTime' || name === 'endTime') {
      validateTime(
        name === 'startTime' ? value : formData.startTime,
        name === 'endTime' ? value : formData.endTime,
        formData.timezone
      );
    }
  };

  const handleTimezoneChange = (value) => {
    setFormData(prev => ({
      ...prev,
      timezone: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Attendee Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Time Zone</Label>
            <Select value={formData.timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {US_TIMEZONES.map((zone) => (
                  <SelectItem key={zone.value} value={zone.value} className="hover:bg-gray-100">
                    {zone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                name="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                name="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          {timeError && (
            <p className="text-sm text-red-500">{timeError}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="attendees">Attendees (comma-separated emails)</Label>
            <Input
              id="attendees"
              name="attendees"
              value={formData.attendees}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule Meeting'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 