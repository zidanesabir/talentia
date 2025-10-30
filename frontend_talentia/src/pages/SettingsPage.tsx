import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  FileText,
  User,
  Settings,
  LogOut,
  Bell,
  LayoutDashboard,
  Shield,
  Globe,
  Palette,
  CreditCard
} from "lucide-react";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab] = useState("settings");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    // Load user data from localStorage
    const storedEmail = localStorage.getItem('user_email');
    const storedName = localStorage.getItem('user_name');
    setUserEmail(storedEmail || '');
    setUserName(storedName || '');
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", id: "dashboard", path: "/dashboard" },
    { icon: Search, label: "Rechercher offres", id: "search", path: "/search" },
    { icon: FileText, label: "Mes candidatures", id: "applications", path: "/applications" },
    { icon: User, label: "Mon profil", id: "profile", path: "/profile" },
    { icon: Settings, label: "Paramètres", id: "settings", path: "/settings" },
  ];

  const [notifications, setNotifications] = useState({
    newOffers: true,
    candidatureUpdates: true,
    interviewReminders: true,
    newsletter: false,
    tips: true
  });

  const [pushNotifications, setPushNotifications] = useState(false);

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
            <h2 className="text-3xl font-bold text-foreground">Paramètres</h2>
            <div className="flex items-center gap-4">
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
          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="bg-card">
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="w-4 h-4" />
                Sécurité
              </TabsTrigger>
              <TabsTrigger value="language" className="gap-2">
                <Globe className="w-4 h-4" />
                Langue
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Palette className="w-4 h-4" />
                Préférences
              </TabsTrigger>
              <TabsTrigger value="subscription" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Abonnement
              </TabsTrigger>
            </TabsList>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Notifications par email</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Gérez les notifications que vous recevez par email
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Nouvelles offres correspondantes</h4>
                      <p className="text-sm text-muted-foreground">
                        Recevez un email quand une nouvelle offre correspond à votre profil
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.newOffers}
                      onCheckedChange={(checked) => setNotifications({...notifications, newOffers: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Mises à jour de candidatures</h4>
                      <p className="text-sm text-muted-foreground">
                        Soyez informé des changements de statut de vos candidatures
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.candidatureUpdates}
                      onCheckedChange={(checked) => setNotifications({...notifications, candidatureUpdates: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Rappels d'entretiens</h4>
                      <p className="text-sm text-muted-foreground">
                        Recevez des rappels 24h avant vos entretiens programmés
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.interviewReminders}
                      onCheckedChange={(checked) => setNotifications({...notifications, interviewReminders: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Newsletter hebdomadaire</h4>
                      <p className="text-sm text-muted-foreground">
                        Résumé hebdomadaire de vos activités et nouvelles opportunités
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.newsletter}
                      onCheckedChange={(checked) => setNotifications({...notifications, newsletter: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Conseils et astuces</h4>
                      <p className="text-sm text-muted-foreground">
                        Recevez des conseils pour optimiser votre recherche d'emploi
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.tips}
                      onCheckedChange={(checked) => setNotifications({...notifications, tips: checked})}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Notifications push</h3>
                
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Activer les notifications push</h4>
                    <p className="text-sm text-muted-foreground">
                      Recevez des notifications en temps réel sur votre navigateur
                    </p>
                  </div>
                  <Switch 
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>

                <div className="flex gap-4 mt-6">
                  <Button>Enregistrer les modifications</Button>
                  <Button variant="outline">Annuler</Button>
                </div>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-6">Informations du compte</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">Adresse email</h4>
                        <p className="text-sm text-muted-foreground">{userEmail || 'email@example.com'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">Nom d'utilisateur</h4>
                        <p className="text-sm text-muted-foreground">{userName || 'Utilisateur'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">Membre depuis</h4>
                        <p className="text-sm text-muted-foreground">Janvier 2024</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">Mot de passe</h4>
                        <p className="text-sm text-muted-foreground">••••••••</p>
                      </div>
                      <Button variant="outline" className="text-primary">
                        Changer mot de passe
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-6">Confidentialité</h3>

                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Profil visible par les recruteurs</h4>
                    <p className="text-sm text-muted-foreground">
                      Permettre aux recruteurs de voir votre profil
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-6">Danger Zone</h3>

                <div className="space-y-4">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      localStorage.removeItem('access_token');
                      localStorage.removeItem('user_id');
                      localStorage.removeItem('user_name');
                      localStorage.removeItem('user_email');
                      navigate('/login');
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Language Tab */}
            <TabsContent value="language" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-6">Paramètres rapides</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <h4 className="font-medium text-foreground mb-3">Thème de l'interface</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Clair ✓</Button>
                      <Button variant="outline" size="sm">Sombre</Button>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <h4 className="font-medium text-foreground mb-3">Langue</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Français ✓</Button>
                      <Button variant="outline" size="sm">English</Button>
                      <Button variant="outline" size="sm">العربية</Button>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <h4 className="font-medium text-foreground mb-3">Fuseau horaire</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">GMT+1 (Casablanca) ✓</Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-6">Préférences de recherche</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Personnalisez votre expérience de recherche d'emploi
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Type de poste recherché</h4>
                    <p className="text-sm text-muted-foreground">CDI, Temps plein</p>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Localisation préférée</h4>
                    <p className="text-sm text-muted-foreground">Casablanca, Rabat</p>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Salaire minimum souhaité</h4>
                    <p className="text-sm text-muted-foreground">50,000 MAD/mois</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-6">Informations du compte</h3>
                
                <div className="p-4 bg-secondary rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Plan actuel</h4>
                  <p className="text-sm text-muted-foreground">Gratuit</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
