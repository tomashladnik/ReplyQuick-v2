'use client';

import { ScheduleModal } from "@/components/appointments/ScheduleModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link as LinkIcon, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from 'react';
import { toast } from "react-hot-toast";

export default function AppointmentsPage() {
  const [date, setDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [emailMessages, setEmailMessages] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

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

  const fetchEmailMessages = async (contactId) => {
    try {
      const response = await fetch(`/api/email/messages?contactId=${contactId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch email messages');
      }
      const data = await response.json();
      setEmailMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching email messages:', err);
      toast.error('Failed to load email messages');
    }
  };

  const handleBookingSelect = (booking) => {
    setSelectedBooking(booking);
    if (booking.attendeeId) {
      fetchEmailMessages(booking.attendeeId);
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
    <main className="flex-1 p-4 sm:p-6 md:p-8">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Appointments</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <Button 
              className="flex items-center gap-2 w-full sm:w-auto"
              onClick={handleScheduleManually}
            >
              <Plus className="h-4 w-4" />
              Schedule Manually
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto"
              onClick={handleShareBookingLink}
            >
              <LinkIcon className="h-4 w-4" />
              Share Booking Link
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Upcoming Bookings */}
          <div className="lg:col-span-2">
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
                  <div className="space-y-3 sm:space-y-4">
                    {bookings.map((booking) => (
                      <Card 
                        key={booking.id} 
                        className={`p-3 sm:p-4 cursor-pointer transition-colors ${
                          selectedBooking?.id === booking.id ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => handleBookingSelect(booking)}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base">{booking.title}</h3>
                            <p className="text-xs sm:text-sm text-gray-500">{booking.client}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-medium text-sm sm:text-base">{booking.date}</p>
                            <p className="text-xs sm:text-sm text-gray-500">{booking.time} ({booking.duration})</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Messages Section */}
            {selectedBooking && (
              <Card className="mt-4 sm:mt-6">
                <CardHeader>
                  <CardTitle>Email Communication</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] sm:h-[400px]">
                    {emailMessages.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {emailMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex w-full ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-2 sm:p-3 mb-2 shadow
                                ${msg.direction === "outbound"
                                  ? "bg-primary text-primary-foreground rounded-br-none ml-8"
                                  : "bg-muted rounded-bl-none mr-8"
                                }`}
                            >
                              <p className="text-xs sm:text-sm break-words">{msg.content}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 text-right">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No email messages yet
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Calendar */}
          
        </div>
      </div>

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={handleScheduleSuccess}
      />
    </main>
  );
} 