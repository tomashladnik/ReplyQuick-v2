'use client';

import { ScheduleModal } from "@/components/appointments/ScheduleModal";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from 'react';
import { toast } from "react-hot-toast";

export default function AppointmentsPage() {
  const [date, setDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/appointments');
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      setBookings(data.bookings);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleManually = () => {
    setIsScheduleModalOpen(true);
  };

  const handleShareBookingLink = () => {
    // TODO: Implement booking link sharing
    toast.success('Booking link sharing coming soon!');
  };

  const handleScheduleSuccess = (newBooking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Appointments</h1>
            <div className="flex gap-4">
              <Button 
                className="flex items-center gap-2"
                onClick={handleScheduleManually}
              >
                <Plus className="h-4 w-4" />
                Schedule Manually
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleShareBookingLink}
              >
                <LinkIcon className="h-4 w-4" />
                Share Booking Link
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upcoming Bookings */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : error ? (
                    <div className="text-red-500 text-center py-4">
                      {error}
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No upcoming bookings
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <Card key={booking.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{booking.title}</h3>
                              <p className="text-sm text-gray-500">{booking.client}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{booking.date}</p>
                              <p className="text-sm text-gray-500">{booking.time} ({booking.duration})</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Calendar */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={handleScheduleSuccess}
      />
    </div>
  );
} 