// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { 
//   Users, 
//   Stethoscope, 
//   FileText, 
//   ShieldAlert,
//   Settings,
//   BarChart3,
//   Mail,
//   Activity
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// interface QuickAction {
//   id: string;
//   label: string;
//   icon: React.ReactNode;
//   path: string;
//   tab?: string;
//   variant?: "default" | "outline" | "destructive";
// }

// const AdminQuickActionsWidget = () => {
//   const navigate = useNavigate();

//   const actions: QuickAction[] = [
//     {
//       id: "suspicious",
//       label: "Review Suspicious Activity",
//       icon: <ShieldAlert className="h-4 w-4" />,
//       path: "/admin",
//       tab: "suspicious",
//       variant: "destructive"
//     },
//     {
//       id: "doctors",
//       label: "Manage Doctors",
//       icon: <Stethoscope className="h-4 w-4" />,
//       path: "/admin",
//       tab: "doctors",
//       variant: "outline"
//     },
//     {
//       id: "analytics",
//       label: "Platform Analytics",
//       icon: <BarChart3 className="h-4 w-4" />,
//       path: "/admin",
//       tab: "platform",
//       variant: "outline"
//     },
//     {
//       id: "audit",
//       label: "View Audit Logs",
//       icon: <Activity className="h-4 w-4" />,
//       path: "/admin",
//       tab: "audit",
//       variant: "outline"
//     },
//     {
//       id: "email-logs",
//       label: "Email Logs",
//       icon: <Mail className="h-4 w-4" />,
//       path: "/admin",
//       tab: "logs",
//       variant: "outline"
//     }
//   ];

//   return (
//     <Card>
//       <CardHeader className="pb-3">
//         <CardTitle className="text-lg">Admin Actions</CardTitle>
//         <CardDescription>Quick access to admin functions</CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-2">
//         {actions.map((action) => (
//           <Button
//             key={action.id}
//             variant={action.variant || "outline"}
//             className="w-full justify-start gap-2"
//             onClick={() => navigate(action.path)}
//           >
//             {action.icon}
//             {action.label}
//           </Button>
//         ))}
//       </CardContent>
//     </Card>
//   );
// };

// export default AdminQuickActionsWidget;
