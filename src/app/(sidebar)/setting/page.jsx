// "use client";
// import { Sidebar } from "@/components/layout/Sidebar";
// import { useSearchParams } from "next/navigation"; // ✅ Detect query params in the URL
// import { useState } from "react";

// export default function SettingsPage() {
//   const [hubSpotConnected, setHubSpotConnected] = useState(false);
//   const [pipedriveConnected, setPipedriveConnected] = useState(false);
//   const [user, setUser] = useState(null);
//   const searchParams = useSearchParams(); // ✅ Get URL parameters

 

//   // useEffect(() => {
//   //   if (user?.id) {
//   //     fetchCrmStatus();
//   //   }
//   // }, [user?.id]); // ✅ Run when user ID is set

//   // ✅ Detect redirection and re-fetch CRM status
//   // useEffect(() => {
//   //   if (searchParams.get("token")) {
//   //     console.log("Redirect detected, checking CRM status...");
//   //     fetchCrmStatus();
//   //   }
//   // }, [searchParams]);

//   // const fetchCrmStatus = async () => {
//   //   try {
//   //     const response = await fetch("/api/crm/status");
//   //     if (!response.ok) throw new Error("Failed to fetch CRM status");

//   //     const data = await response.json();
//   //     setHubSpotConnected(data?.hubSpotConnected || false);
//   //     setPipedriveConnected(data?.pipedriveConnected || false);
//   //   } catch (error) {
//   //     console.error("Error checking CRM status:", error);
//   //   }
//   // };

//   const connectCRM = async (crm) => {
//     try {
//       const authUrl = `/api/crm/connect?platform=${crm}`;
//       window.location.href = authUrl;
//     } catch (error) {
//       console.error(`Error connecting to ${crm}:`, error);
//     }
//   };

//   const disconnectCRM = async (crm) => {
//     try {
//       const response = await fetch("/api/crm/disconnect", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ platform: crm }),
//       });

//       if (response.ok) {
//         if (crm === "hubspot") setHubSpotConnected(false);
//         if (crm === "pipedrive") setPipedriveConnected(false);
//       }
//     } catch (error) {
//       console.error(`Error disconnecting ${crm}:`, error);
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       <Sidebar />
//       <main className="flex-1 p-8">
//         <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-2xl mx-auto">
//           <h2 className="text-xl font-semibold mb-4">CRM Integration</h2>

//           {/* HubSpot Integration */}
//           <div className="mb-4">
//             <p className="mb-2">HubSpot</p>
//             {hubSpotConnected ? (
//               <button
//                 className="bg-red-500 text-white px-4 py-2 rounded cursor-pointer"
//                 onClick={() => disconnectCRM("hubspot")}
//               >
//                 Disconnect HubSpot
//               </button>
//             ) : (
//               <button
//                 className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
//                 onClick={() => connectCRM("hubspot")}
//               >
//                 Connect HubSpot
//               </button>
//             )}
//           </div>

//           {/* Pipedrive Integration */}
//           <div>
//             <p className="mb-2">Pipedrive</p>
//             {pipedriveConnected ? (
//               <button
//                 className="bg-red-500 text-white px-4 py-2 rounded cursor-pointer"
//                 onClick={() => disconnectCRM("pipedrive")}
//               >
//                 Disconnect Pipedrive
//               </button>
//             ) : (
//               <button
//                 className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
//                 onClick={() => connectCRM("pipedrive")}
//               >
//                 Connect Pipedrive
//               </button>
//             )}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }
