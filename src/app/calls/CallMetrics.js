"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CallMetrics() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="daily" className="w-full">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="daily" className="mt-4">
          <div className="h-[240px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md">
            {/* This would be your actual chart component */}
            <div className="text-center">
              <p className="text-muted-foreground">Call Volume Chart</p>
              <p className="text-xs text-muted-foreground mt-1">(Chart visualization would go here)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Success Rate</p>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">86%</div>
                <div className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">+4%</div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Avg. Call Duration</p>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">3:24</div>
                <div className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">+0:12</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="weekly">
          <div className="h-[240px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-muted-foreground">Weekly metrics would appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <div className="h-[240px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-muted-foreground">Monthly metrics would appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

