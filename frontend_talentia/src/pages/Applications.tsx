import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Search, 
  FileText,
  User,
  Settings,
  LogOut,
  Bell,
  LayoutDashboard,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar
} from "lucide-react";

const Applications = () => {
  const navigate = useNavigate();
  const [activeTab] = useState("applications");

  const stats = [
    { label: "Total candidatures", value: "24", subtitle: "+3 ce mois", icon: FileText, color: "text-primary" },
    { label: "En attente", value: "12", subtitle: "Réponse attendue", icon: Clock, color: "text-warning" },
    { label: "Entretiens", value: "8", subtitle: "Confirmés", icon: CheckCircle2, color: "text-success" },
    { label: "Refusées", value: "4", subtitle: "Ce mois-ci", icon: XCircle, color: "text-destructive" }
  ];

  const applications = [
    {
      id: 1,
      company: "TechCorp Solutions",
      initials: "TC",
      color: "bg-info",
      title: "Développeur Full Stack",
      location: "Casablanca",
      appliedDate: "Postulé le 16 Oct 2025",
      matchScore: 87,
      status: "interview",
      statusLabel: "Entretien le 20 Oct",
      statusColor: "text-success",
      statusBg: "bg-success/10",
      interviewDate: "14h00 - Visio",
      action: "Voir détails"
    },
    {
      id: 2,
      company: "AI Innovations",
      initials: "AI",
      color: "bg-accent",
      title: "Data Scientist",
      location: "Rabat",
      appliedDate: "Postulé le 08 Oct 2025",
      matchScore: 82,
      status: "pending",
      statusLabel: "En cours d'examen",
      statusColor: "text-warning",
      statusBg: "bg-warning/10",
      interviewDate: "CV transmis au RH",
      action: "Voir détails"
    },
    {
      id: 3,
      company: "FinTech Pro",
      initials: "FT",
      color: "bg-success",
      title: "Architecte Cloud",
      location: "Casablanca",
      appliedDate: "Postulé le 05 Oct 2025",
      matchScore: 75,
      status: "pending",
      statusLabel: "Postulation envoyée",
      statusColor: "text-warning",
      statusBg: "bg-warning/10",
      interviewDate: "Il y a 15 jours",
      action: "Voir retour"
    },
    {
      id: 4,
      company: "StartupHub",
      initials: "SH",
      color: "bg-destructive",
      title: "Lead Developer",
      location: "Rabat",
      appliedDate: "Postulé le 01 Oct 2025",
      matchScore: 70,
      status: "rejected",
      statusLabel: "Profil non retenu",
      statusColor: "text-destructive",
      statusBg: "bg-destructive/10",
      interviewDate: "Il y a 18 jours",
      action: "Voir retour"
    }
  ];

  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", id: "dashboard", path: "/dashboard" },
    { icon: Search, label: "Rechercher offres", id: "search", path: "/search" },
    { icon: FileText, label: "Mes candidatures", id: "applications", path: "/applications" },
    { icon: User, label: "Mon profil", id: "profile", path: "/profile" },
    { icon: Settings, label: "Paramètres", id: "settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold">Talentia AI</h1>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button 
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-foreground">Mes Candidatures</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-10 bg-secondary"
                />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </Button>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                S
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 ${stat.color === "text-primary" ? "bg-primary/10" : stat.color === "text-warning" ? "bg-warning/10" : stat.color === "text-success" ? "bg-success/10" : "bg-destructive/10"} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className={`text-4xl font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                  <div className="text-sm font-medium text-foreground">{stat.label}</div>
                  <div className="flex items-center gap-1 text-sm text-success mt-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{stat.subtitle}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Toutes (24)</TabsTrigger>
              <TabsTrigger value="pending">En cours (12)</TabsTrigger>
              <TabsTrigger value="interviews">Entretiens (8)</TabsTrigger>
              <TabsTrigger value="accepted">Acceptées (0)</TabsTrigger>
              <TabsTrigger value="rejected">Refusées (4)</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 ${app.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <span className="text-2xl font-bold text-white">{app.initials}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-foreground mb-1">{app.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {app.company} • {app.location}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {app.appliedDate} • Score: {app.matchScore}%
                          </p>
                        </div>
                        <div className="text-right">
                          {app.status === "interview" && (
                            <div className="mb-2">
                              <Badge className={`${app.statusBg} ${app.statusColor} border-0`}>
                                {app.statusLabel}
                              </Badge>
                              <div className="text-sm text-foreground mt-1">{app.interviewDate}</div>
                            </div>
                          )}
                          {app.status === "pending" && (
                            <div className="mb-2">
                              <Badge className={`${app.statusBg} ${app.statusColor} border-0`}>
                                {app.statusLabel}
                              </Badge>
                              <div className="text-sm text-muted-foreground mt-1">{app.interviewDate}</div>
                            </div>
                          )}
                          {app.status === "rejected" && (
                            <div className="mb-2">
                              <Badge className={`${app.statusBg} ${app.statusColor} border-0`}>
                                {app.statusLabel}
                              </Badge>
                              <div className="text-sm text-muted-foreground mt-1">{app.interviewDate}</div>
                            </div>
                          )}
                          <Button 
                            variant={app.status === "interview" ? "default" : "outline"}
                            size="sm"
                            className="mt-2"
                            onClick={() => navigate(`/job/${app.id}`)}
                          >
                            {app.action}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Applications;
