import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Search,
  Upload,
  SlidersHorizontal,
  FileText,
  User,
  Settings,
  LogOut,
  Bell,
  LayoutDashboard,
  Calendar,
  MapPin,
  Briefcase,
  DollarSign,
  ArrowRight
} from "lucide-react";

const SearchJobs = () => {
  const navigate = useNavigate();
  const [activeTab] = useState("search");
  const [userName, setUserName] = useState<string>("");
  const [salaryRange, setSalaryRange] = useState([40]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const itemsPerPage = 10;

  // Filter states
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Fetch jobs from backend
  const fetchJobs = async (page = 1, query = "") => {
    setLoading(true);
    try {
      const api = await import("@/lib/api");
      const response = await api.getAllJobs({
        page,
        page_size: itemsPerPage,
        q: query || undefined
      });

      setJobs(response.jobs || []);
      setTotalJobs(response.total || 0);
      setCurrentPage(page);
      applyFilters(response.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to jobs
  const applyFilters = (jobsToFilter: any[]) => {
    let filtered = jobsToFilter;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by location
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(job =>
        selectedLocations.some(loc =>
          job.location?.toLowerCase().includes(loc.toLowerCase())
        )
      );
    }

    // Filter by contract type
    if (selectedContractTypes.length > 0) {
      filtered = filtered.filter(job =>
        selectedContractTypes.some(type =>
          job.type?.toLowerCase().includes(type.toLowerCase())
        )
      );
    }

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(job => {
        if (!job.scraped_at) return true;
        const jobDate = new Date(job.scraped_at);
        if (dateRange.from && jobDate < new Date(dateRange.from)) return false;
        if (dateRange.to && jobDate > new Date(dateRange.to)) return false;
        return true;
      });
    }

    setFilteredJobs(filtered);
  };

  const [cvAnalyzedCount, setCvAnalyzedCount] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerUpload = () => fileInputRef.current?.click();

  // Get unique locations and contract types from jobs
  const getUniqueLocations = () => {
    const locations = new Set(jobs.map(j => j.location).filter(Boolean));
    return Array.from(locations).map(loc => ({ label: loc, value: loc }));
  };

  const getUniqueContractTypes = () => {
    const types = new Set(jobs.map(j => j.type).filter(Boolean));
    return Array.from(types).map(type => ({ label: type, value: type }));
  };

  useEffect(() => {
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setUserName(storedName);
    } else {
      const email = localStorage.getItem('user_email');
      setUserName(email ? email.split('@')[0] : 'Utilisateur');
    }

    // Fetch jobs on component mount
    fetchJobs(1);
  }, []);

  // Apply filters when filter states change
  useEffect(() => {
    applyFilters(jobs);
  }, [searchQuery, selectedLocations, selectedContractTypes, dateRange]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  const handleFileSelected = async (file?: File) => {
    if (!file) return;
    try {
      const api = await import("@/lib/api");
      const uploadRes = await api.uploadCV(file);

      setUploadStatus({
        id: uploadRes?.id,
        text_length: uploadRes?.text_length,
        has_embedding: uploadRes?.has_embedding,
        embedding_error: uploadRes?.embedding_error || null,
        message: uploadRes?.message || null,
      });

      if (uploadRes?.id && uploadRes?.has_embedding) {
        const matchRes = await api.matchJobs(uploadRes.id, 10);
        setCvAnalyzedCount(matchRes?.matches?.length ?? 0);
      } else {
        setCvAnalyzedCount(0);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'analyse du CV");
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", id: "dashboard", path: "/dashboard" },
    { icon: Search, label: "Rechercher offres", id: "search", path: "/search" },
    { icon: FileText, label: "Mes candidatures", id: "applications", path: "/applications" },
    { icon: User, label: "Mon profil", id: "profile", path: "/profile" },
    { icon: Settings, label: "Paramètres", id: "settings", path: "/settings" },
  ];

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 70) return "bg-info";
    return "bg-warning";
  };

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
            <h2 className="text-3xl font-bold text-foreground">Bienvenue, {userName || 'Utilisateur'}</h2>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </Button>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                {(userName && userName[0]) ? userName[0].toUpperCase() : 'U'}
              </div>
              <Button variant="ghost" onClick={handleLogout} className="ml-2">Déconnexion</Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Search Header */}
          <div className="bg-card p-6 rounded-lg mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-4">Recherche d'offres</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Importez votre CV et notre IA trouvera automatiquement les offres qui correspondent à votre profil
            </p>
            
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" className="gap-2" onClick={triggerUpload}>
                <Upload className="w-4 h-4" />
                Glissez votre CV ici ou
              </Button>
              <Button variant="link" className="text-accent" onClick={triggerUpload}>
                cliquez pour parcourir
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files && e.target.files[0];
                  if (f) handleFileSelected(f);
                }}
              />
            </div>

            <div className="flex items-center gap-2 mb-4">
              {uploadStatus ? (
                uploadStatus.has_embedding ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-2">
                    <FileText className="w-3 h-3" />
                    CV analysé — {cvAnalyzedCount}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-2">
                    <FileText className="w-3 h-3" />
                    CV téléchargé — embeddings indisponibles
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-muted/20 gap-2">
                  <FileText className="w-3 h-3" />
                  Aucun CV analysé
                </Badge>
              )}
            </div>

            {uploadStatus && uploadStatus.embedding_error && (
              <div className="text-xs text-amber-700 mb-4">Embeddings error: {uploadStatus.embedding_error}</div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par mots-clés..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-info">{filteredJobs.length} offres trouvées</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trier par:</span>
              <Button variant="ghost" size="sm" className="text-foreground">
                Plus pertinents ▼
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="space-y-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-foreground">Filtres</h4>
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Contract Type */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-foreground mb-3">Type de contrat</h5>
                  <div className="space-y-2">
                    {getUniqueContractTypes().map((type) => (
                      <div key={type.value} className="flex items-center gap-2">
                        <Checkbox
                          id={type.value}
                          checked={selectedContractTypes.includes(type.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedContractTypes([...selectedContractTypes, type.value]);
                            } else {
                              setSelectedContractTypes(selectedContractTypes.filter(t => t !== type.value));
                            }
                          }}
                        />
                        <label htmlFor={type.value} className="text-sm text-foreground cursor-pointer">
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-foreground mb-3">Localisation</h5>
                  <div className="space-y-2">
                    {getUniqueLocations().map((loc) => (
                      <div key={loc.value} className="flex items-center gap-2">
                        <Checkbox
                          id={loc.value}
                          checked={selectedLocations.includes(loc.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLocations([...selectedLocations, loc.value]);
                            } else {
                              setSelectedLocations(selectedLocations.filter(l => l !== loc.value));
                            }
                          }}
                        />
                        <label htmlFor={loc.value} className="text-sm text-foreground cursor-pointer">
                          {loc.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-foreground mb-3">Date de publication</h5>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">De:</label>
                      <Input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">À:</label>
                      <Input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Salary */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-foreground mb-3">Salaire (MAD/mois)</h5>
                  <div className="px-2">
                    <Slider
                      value={salaryRange}
                      onValueChange={setSalaryRange}
                      max={100}
                      step={5}
                      className="mb-2"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>40K - 60K</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  Appliquer les filtres
                </Button>
              </Card>
            </div>

            {/* Jobs List */}
            <div className="col-span-3 space-y-4">
              {loading ? (
                <Card className="p-6">
                  <div className="text-center text-muted-foreground">Chargement des offres...</div>
                </Card>
              ) : filteredJobs.length === 0 ? (
                <Card className="p-6">
                  <div className="text-center text-muted-foreground">Aucune offre trouvée</div>
                </Card>
              ) : (
                filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((job) => {
                  const initials = (job.company || 'JOB').substring(0, 2).toUpperCase();
                  const colors = ['bg-info', 'bg-accent', 'bg-success', 'bg-destructive', 'bg-warning'];
                  const colorIndex = (job.id?.charCodeAt(0) || 0) % colors.length;
                  const jobDate = job.scraped_at ? new Date(job.scraped_at).toLocaleDateString('fr-FR') : 'N/A';

                  return (
                    <Card
                      key={job.id}
                      className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/job/${job.id}`, { state: { matchScore: job.matchScore || 0 } })}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 ${colors[colorIndex]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <span className="text-xl font-bold text-white">{initials}</span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-lg font-bold text-foreground mb-1">{job.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {job.company} • {job.location || 'N/A'}
                              </p>
                            </div>
                            <div className={`${getMatchColor(job.matchScore || 0)} text-white px-4 py-2 rounded-lg text-center min-w-[70px]`}>
                              <div className="text-xl font-bold">{job.matchScore || 0}%</div>
                              <div className="text-xs">Match</div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {job.type && <Badge variant="secondary" className="gap-1"><Briefcase className="w-3 h-3" />{job.type}</Badge>}
                            {job.salary && <Badge variant="secondary" className="gap-1"><DollarSign className="w-3 h-3" />{job.salary}</Badge>}
                            {jobDate && <Badge variant="secondary" className="gap-1"><Calendar className="w-3 h-3" />{jobDate}</Badge>}
                            {job.location && <Badge variant="secondary" className="gap-1"><MapPin className="w-3 h-3" />{job.location}</Badge>}
                          </div>

                          {job.skills && Array.isArray(job.skills) && job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {job.skills.slice(0, 5).map((skill: any) => {
                                const skillName = typeof skill === 'string' ? skill : skill.name;
                                return (
                                  <Badge key={skillName} className="bg-primary/10 text-primary hover:bg-primary/20">
                                    {skillName}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}

              {/* Pagination */}
              {filteredJobs.length > itemsPerPage && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    ‹ Précédent
                  </Button>

                  {Array.from({ length: Math.ceil(filteredJobs.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredJobs.length / itemsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredJobs.length / itemsPerPage)}
                  >
                    Suivant ›
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SearchJobs;
