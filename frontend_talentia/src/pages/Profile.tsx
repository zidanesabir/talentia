import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  FileText,
  User,
  Settings,
  LogOut,
  Bell,
  LayoutDashboard,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  GraduationCap,
  Download,
  Edit,
  Save
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    city: "",
    country: "",
    bio: "",
    title: "",
    experience: ""
  });

  useEffect(() => {
    // Load user data from localStorage
    const storedName = localStorage.getItem('user_name');
    const storedEmail = localStorage.getItem('user_email');
    setUserName(storedName || 'Utilisateur');
    setUserEmail(storedEmail || '');

    // Initialize profile data
    if (storedName && storedEmail) {
      const nameParts = storedName.split(' ');
      setProfileData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: storedEmail
      }));
    }
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", id: "dashboard", path: "/dashboard" },
    { icon: Search, label: "Rechercher offres", id: "search", path: "/search" },
    { icon: FileText, label: "Mes candidatures", id: "applications", path: "/applications" },
    { icon: User, label: "Mon profil", id: "profile", path: "/profile" },
    { icon: Settings, label: "Paramètres", id: "settings", path: "/settings" },
  ];

  const skills = ["React", "Python", "Node.js", "SQL"];

  const experiences = [
    {
      title: "Développeur Full Stack",
      company: "TechCorp Solutions",
      period: "2022 - Présent",
      location: "Casablanca",
      description: "Développement d'applications web modernes"
    },
    {
      title: "Développeur Junior",
      company: "StartupHub",
      period: "2020 - 2022",
      location: "Rabat",
      description: "Création de sites web et APIs"
    }
  ];

  const education = [
    {
      degree: "Master en Informatique",
      school: "Université Hassan II",
      period: "2018 - 2020",
      location: "Casablanca",
      specialization: "Spécialisation: Développement Web"
    }
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
            <h2 className="text-3xl font-bold text-foreground">Mon Profil</h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Profil: <span className="text-success font-medium">92% complété</span>
              </div>
              <Button className="gap-2" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    Modifier
                  </>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </Button>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                {(userName && userName[0]) ? userName[0].toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="col-span-2 space-y-6">
              {/* Profile Header */}
              <Card className="p-8">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground relative">
                    <span className="text-4xl font-bold">{(userName && userName[0]) ? userName[0].toUpperCase() : 'U'}</span>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-info rounded-full border-2 border-card flex items-center justify-center">
                      <Edit className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-foreground mb-2">{userName || 'Utilisateur'}</h1>
                    <p className="text-lg text-muted-foreground mb-4">
                      {profileData.title || 'Professionnel'} | {profileData.experience || 'Expérience'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {profileData.city && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {profileData.city}, {profileData.country || 'Maroc'}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {userEmail || 'email@example.com'}
                      </div>
                      {profileData.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {profileData.phone}
                        </div>
                      )}
                      {profileData.birthDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {profileData.birthDate}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} className="bg-primary/10 text-primary hover:bg-primary/20">
                          {skill}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-muted-foreground">
                        +12 compétences
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Personal Information */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">Informations personnelles</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Prénom</label>
                    <Input
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Nom</label>
                    <Input
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                    <Input
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      type="email"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Téléphone</label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      disabled={!isEditing}
                      placeholder="+212 6 XX XX XX XX"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Date de naissance</label>
                    <Input
                      value={profileData.birthDate}
                      onChange={(e) => setProfileData({...profileData, birthDate: e.target.value})}
                      disabled={!isEditing}
                      placeholder="JJ/MM/YYYY"
                    />
                  </div>
                </div>
              </Card>

              {/* Location */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Localisation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Ville</label>
                    <Input
                      value={profileData.city}
                      onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Casablanca"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Pays</label>
                    <Input
                      value={profileData.country}
                      onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Maroc"
                    />
                  </div>
                </div>
              </Card>

              {/* Bio */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Bio professionnelle</h3>
                <Textarea
                  placeholder="Décrivez votre profil professionnel..."
                  className="min-h-[120px]"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  disabled={!isEditing}
                />
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Profile Completion */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Complétude du profil</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Progression</span>
                      <span className="text-2xl font-bold text-success">92%</span>
                    </div>
                    <Progress value={92} className="h-3" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Pour améliorer votre profil:</p>
                    <ul className="space-y-1 text-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Ajouter une lettre de motivation</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Experience */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Expérience professionnelle
                  </h3>
                  <Button variant="ghost" size="sm" className="text-primary">
                    + Ajouter
                  </Button>
                </div>

                <div className="space-y-4">
                  {experiences.map((exp, index) => (
                    <div key={index} className="border-l-2 border-primary pl-4">
                      <h4 className="font-bold text-foreground">{exp.title}</h4>
                      <p className="text-sm text-muted-foreground">{exp.company}</p>
                      <p className="text-sm text-muted-foreground">{exp.period} • {exp.location}</p>
                      <p className="text-sm text-foreground mt-1">{exp.description}</p>
                    </div>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="w-full mt-4 text-primary">
                  + Ajouter expérience
                </Button>
              </Card>

              {/* Education */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Formation
                  </h3>
                  <Button variant="ghost" size="sm" className="text-primary">
                    + Ajouter
                  </Button>
                </div>

                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={index} className="border-l-2 border-info pl-4">
                      <h4 className="font-bold text-foreground">{edu.degree}</h4>
                      <p className="text-sm text-muted-foreground">{edu.school}</p>
                      <p className="text-sm text-muted-foreground">{edu.period} • {edu.location}</p>
                      <p className="text-sm text-foreground mt-1">{edu.specialization}</p>
                    </div>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="w-full mt-4 text-primary">
                  + Ajouter formation
                </Button>
              </Card>

              {/* Documents */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Documents</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-sm text-foreground">CV_Mohammed_2025.pdf</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
