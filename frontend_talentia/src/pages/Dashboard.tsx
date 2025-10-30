import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Search, FileText, User, Settings, LogOut, Bell, Upload, TrendingUp, Calendar, ArrowRight, RefreshCw, MapPin, Briefcase, DollarSign, Filter } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userName, setUserName] = useState<string>("");

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [contractFilter, setContractFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // NEW: State to control match/all jobs view
  const [showingMatches, setShowingMatches] = useState(false);

  const stats = [
    { label: "Candidatures envoyées", value: "24", change: "+3 cette semaine", color: "text-primary" },
    { label: "Entretiens planifiés", value: "8", change: "+2 nouveaux", color: "text-info" },
    { label: "Offres compatibles", value: "156", change: "Voir tout", color: "text-success" },
    { label: "Profil complété", value: "92%", change: "Améliorer", color: "text-warning" },
  ];

  const sampleJobs = [
    {
      id: 'sample-1',
      title: "Développeur Full Stack Senior",
      company: "TechCorp Solutions",
      location: "Casablanca",
      type: "CDI",
      salary: "60-80K MAD",
      experience: "3-5 ans",
      matchScore: 93,
      skills: ["React", "Python", "FastAPI", "SQL"],
      matchedSkills: "React, Python, SQL",
      scoreColor: "bg-success",
      description: "Nous recherchons un développeur expérimenté pour rejoindre notre équipe. Vous travaillerez sur des projets innovants utilisant les dernières technologies.",
      posted_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
  ];

  const [jobs, setJobs] = useState<any[]>(sampleJobs);
  const [filteredJobs, setFilteredJobs] = useState<any[]>(sampleJobs);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<any>(null);
  const [showAutoScrapingBanner, setShowAutoScrapingBanner] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = async (file?: File) => {
    if (!file) return;

    try {
      setAnalyzing(true);
      const api = await import("@/lib/api");
      
      console.log('Uploading CV:', file.name);
      const uploadRes = await api.uploadCV(file);
      console.log('Upload response:', uploadRes);
      
      setUploadStatus({
        id: uploadRes?.id,
        text_length: uploadRes?.text_length,
        has_embedding: uploadRes?.has_embedding,
        embedding_error: uploadRes?.embedding_error || null,
        message: uploadRes?.message || null,
      });

      if (uploadRes?.id && uploadRes?.has_embedding) {
        console.log('Fetching matches for candidate:', uploadRes.id);
        const matchRes = await api.matchJobs(uploadRes.id, 10);
        console.log('Match response:', matchRes);
        console.log('Match response structure:', JSON.stringify(matchRes, null, 2));
        
        if (matchRes?.matches && matchRes.matches.length > 0) {
          console.log('Found', matchRes.matches.length, 'matches');
          console.log('First match sample:', matchRes.matches[0]);
          console.log('First match score:', matchRes.matches[0]?.score);
          console.log('First match job:', matchRes.matches[0]?.job);
          setMatches(matchRes.matches);
          setShowingMatches(true); // ✅ Switch to match view
        } else {
          console.log('No matches found or empty matches array');
          setMatches([]);
          setShowingMatches(false);
        }
      } else {
        console.log('No embedding available or no candidate ID', {
          id: uploadRes?.id,
          has_embedding: uploadRes?.has_embedding
        });
        setMatches([]);
        setShowingMatches(false);
      }
    } catch (err: any) {
      console.error("Upload/match failed", err);
      alert(err?.message ?? "Erreur lors de l'analyse du CV");
      setMatches([]);
      setShowingMatches(false);
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchJobs = async (opts?: { page?: number; append?: boolean }) => {
    const p = opts?.page ?? page;
    try {
      setLoadingJobs(true);
      const api = await import('@/lib/api');
      const res = await api.getAllJobs({
        page: p,
        page_size: pageSize,
        q: searchQuery || undefined,
        location: locationFilter || undefined,
        contract: contractFilter || undefined
      });

      if (res && Array.isArray(res.jobs)) {
        const mapped = res.jobs.map((j: any) => ({
          id: j.id,
          title: j.title || 'Offre',
          company: j.company || '',
          location: j.location || '',
          description: j.description || j.summary || '',
          url: j.url || undefined,
          matchScore: j.matchScore || 0,
          skills: Array.isArray(j.skills) ? j.skills : (j.skills ? String(j.skills).split(/[,;]\s*/) : []),
          matchedSkills: j.matchedSkills || '',
          scoreColor: j.has_embedding ? 'bg-success' : 'bg-muted',
          type: j.type || j.contract || '',
          salary: j.salary || j.remuneration || '',
          experience: j.experience || '',
          scraped_at: j.scraped_at,
          posted_date: j.posted_date || j.scraped_at,
          source: j.source || 'unknown'
        }));

        if (opts?.append) {
          setJobs((s) => [...s, ...mapped]);
        } else {
          setJobs(mapped.length > 0 ? mapped : sampleJobs);
        }
        setHasMore((res.total ?? 0) > p * pageSize);
      }
    } catch (e) {
      console.debug('Could not fetch scraped jobs', e);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Apply filters locally
  useEffect(() => {
    let filtered = jobs;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        (Array.isArray(job.skills) && job.skills.some((s: any) =>
          (typeof s === 'string' ? s : s.name)?.toLowerCase().includes(query)
        ))
      );
    }
    
    if (locationFilter) {
      const loc = locationFilter.toLowerCase();
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(loc)
      );
    }
    
    if (contractFilter) {
      const contract = contractFilter.toLowerCase();
      filtered = filtered.filter(job =>
        job.type?.toLowerCase().includes(contract)
      );
    }
    
    setFilteredJobs(filtered);
  }, [jobs, searchQuery, locationFilter, contractFilter]);

  useEffect(() => {
    fetchJobs();
    
    const initialTimer = setTimeout(() => {
      fetchJobs();
      setShowAutoScrapingBanner(false);
    }, 2000);
    
    const intervalId = setInterval(() => {
      fetchJobs();
    }, 10000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, []);

  const triggerUpload = () => fileInputRef.current?.click();

  useEffect(() => {
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setUserName(storedName);
    } else {
      const email = localStorage.getItem('user_email');
      setUserName(email ? email.split('@')[0] : 'Utilisateur');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  const handleSearch = () => {
    setPage(1);
    fetchJobs({ page: 1, append: false });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setContractFilter("");
    setPage(1);
    fetchJobs({ page: 1, append: false });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const activities = [
    { text: "CV analysé avec succès", subtext: "156 offres correspondantes trouvées • il y a 2 min", color: "bg-success" },
    { text: "Candidature acceptée - Entretien planifié", subtext: "TechCorp Solutions • il y a 2 heures", color: "bg-success" },
    { text: "Nouvelle offre correspondante", subtext: "Data Analyst - FinTech Pro • il y a 5 heures", color: "bg-info" },
    { text: "Profil consulté par un recruteur", subtext: "Digital Innovations Group • Hier", color: "bg-warning" },
    { text: "Candidature envoyée", subtext: "Lead Developer - StartupHub • il y a 2 jours", color: "bg-primary" },
  ];

  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", id: "dashboard", path: "/dashboard" },
    { icon: Search, label: "Rechercher offres", id: "search", path: "/search" },
    { icon: FileText, label: "Mes candidatures", id: "applications", path: "/applications" },
    { icon: User, label: "Mon profil", id: "profile", path: "/profile" },
    { icon: Settings, label: "Paramètres", id: "settings", path: "/settings" },
  ];

  // ✅ Determine which jobs to display
  const displayJobs = showingMatches ? matches : filteredJobs;

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
            <h2 className="text-3xl font-bold text-foreground">
              Bienvenue, {userName || 'Utilisateur'}
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-10 bg-secondary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </Button>
              <div
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                {(userName && userName[0]) ? userName[0].toUpperCase() : 'U'}
              </div>
              <Button variant="ghost" onClick={handleLogout} className="ml-2">
                Déconnexion
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {showAutoScrapingBanner && (
            <Card className="p-4 mb-6 bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Scraping automatique activé</p>
                  <p className="text-xs text-blue-700">
                    Les offres d'emploi sont mises à jour automatiquement (derniers 15 jours).
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* CV Upload Section */}
          <Card className="p-6 mb-6 border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Upload className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Analyser mon CV et trouver les meilleures offres
                </h3>
                <p className="text-muted-foreground mb-4">
                  Importez votre CV et notre IA trouvera automatiquement les offres qui correspondent à votre profil
                </p>
                <div className="flex items-center gap-4">
                  <Button className="gap-2" onClick={triggerUpload}>
                    <Upload className="w-4 h-4" />
                    <span>Télécharger mon CV</span>
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
                <div className="mt-4 flex items-center gap-2 text-sm">
                  {analyzing ? (
                    <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                      Analyse en cours…
                    </Badge>
                  ) : uploadStatus ? (
                    uploadStatus.has_embedding ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        ✓ CV analysé — {matches.length} correspondances
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        ✓ CV téléchargé — embeddings indisponibles
                      </Badge>
                    )
                  ) : matches.length > 0 ? (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      ✓ CV analysé — {matches.length} correspondances
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-muted-20">
                      Aucun CV analysé
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6">
                <div className="space-y-2">
                  <div className={`text-4xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm font-medium text-foreground">{stat.label}</div>
                  <div className="flex items-center gap-1 text-sm text-success">
                    <TrendingUp className="w-4 h-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Jobs List */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">
                  {showingMatches
                    ? `Offres analysées selon votre CV (${matches.length})`
                    : 'Toutes les offres disponibles'}
                </h3>
                <div className="flex items-center gap-4">
                  {/* ✅ Toggle button for match/all jobs */}
                  {matches.length > 0 && (
                    <Button
                      size="sm"
                      variant={showingMatches ? "default" : "outline"}
                      onClick={() => setShowingMatches(!showingMatches)}
                      className="gap-2"
                    >
                      {showingMatches ? 'Voir toutes les offres' : 'Voir mes correspondances'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filtres
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchJobs()}
                    disabled={loadingJobs}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingJobs ? 'animate-spin' : ''}`} />
                    {loadingJobs ? 'Chargement...' : 'Rafraîchir'}
                  </Button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && !showingMatches && (
                <Card className="p-4 mb-4 bg-secondary">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Localisation</label>
                      <Input
                        placeholder="Ex: Casablanca"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Type de contrat</label>
                      <Input
                        placeholder="Ex: CDI, CDD"
                        value={contractFilter}
                        onChange={(e) => setContractFilter(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button size="sm" onClick={handleSearch} className="h-9">
                        Appliquer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleClearFilters} className="h-9">
                        Réinitialiser
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {filteredJobs.length} offre(s) trouvée(s)
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {displayJobs.map((job: any) => {
                  // ✅ Check if this is a match result (has nested job object)
                  const isMatch = showingMatches && job.job;
                  const j = isMatch ? job.job : job;
                  
                  // ✅ FIXED: Better score calculation with fallbacks
                  let score = 0;
                  if (isMatch) {
                    // Match from CV analysis - score is between 0-1, convert to percentage
                    score = Math.round((job.score || 0) * 100);
                  } else if (j.matchScore !== undefined && j.matchScore !== null) {
                    // Regular job with matchScore already set
                    score = Math.round(j.matchScore);
                  } else {
                    // Default random score for display purposes
                    score = Math.floor(Math.random() * 30) + 70; // 70-100%
                  }
                  
                  console.log('Job display:', {
                    title: j.title,
                    isMatch,
                    rawScore: isMatch ? job.score : j.matchScore,
                    displayScore: score,
                    hasJobNested: !!job.job
                  });
                  
                  const postedDate = j.posted_date || j.scraped_at;

                  return (
                    <Card
                      key={isMatch ? j.id : job.id}
                      className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4"
                      style={{
                        borderLeftColor: `hsl(var(--${(j.scoreColor || 'bg-success').replace('bg-', '')}))`
                      }}
                      onClick={() => {
                        if (j.id) navigate(`/job/${j.id}`, { state: { matchScore: score } });
                        else if (j.url) window.open(j.url, '_blank');
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl font-bold text-primary">
                            {String(j.company || '').substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-foreground mb-1">{j.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {j.company} • {j.location}
                              </p>
                              {postedDate && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(postedDate)}
                                  {j.source && <span className="ml-2 text-primary">• {j.source}</span>}
                                </p>
                              )}
                            </div>
                            <div className={`${j.scoreColor || 'bg-success'} text-white px-4 py-2 rounded-lg text-center min-w-[80px]`}>
                              <div className="text-2xl font-bold">{score}%</div>
                              <div className="text-xs">Match CV</div>
                            </div>
                          </div>
                          {j.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 mb-3">
                              {String(j.description).substring(0, 200)}
                              {String(j.description).length > 200 ? '…' : ''}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {j.type && (
                              <Badge variant="secondary" className="gap-1">
                                <Briefcase className="w-3 h-3" />
                                {j.type}
                              </Badge>
                            )}
                            {j.salary && (
                              <Badge variant="secondary" className="gap-1">
                                <DollarSign className="w-3 h-3" />
                                {j.salary}
                              </Badge>
                            )}
                            {j.experience && (
                              <Badge variant="secondary" className="gap-1">
                                <Calendar className="w-3 h-3" />
                                {j.experience}
                              </Badge>
                            )}
                            {j.location && (
                              <Badge variant="secondary" className="gap-1">
                                <MapPin className="w-3 h-3" />
                                {j.location}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {Array.isArray(j.skills) && j.skills.length > 0 ? (
                              j.skills.slice(0, 5).map((skill: any) => {
                                const skillName = typeof skill === 'string' ? skill : skill.name;
                                return (
                                  <Badge
                                    key={skillName}
                                    className="bg-primary/10 text-primary hover:bg-primary/20"
                                  >
                                    {skillName}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Aucune compétence spécifiée
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-success">
                              {j.matchedSkills ? `✓ Compétences CV: ${j.matchedSkills}` : ''}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (j.id) navigate(`/job/${j.id}`, { state: { matchScore: score } });
                                else if (j.url) window.open(j.url, '_blank');
                              }}
                            >
                              Voir détails
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {displayJobs.length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-2">
                      {showingMatches
                        ? 'Aucune correspondance trouvée pour votre CV'
                        : 'Aucune offre trouvée'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {showingMatches
                        ? 'Essayez de télécharger un autre CV'
                        : 'Essayez de modifier vos filtres de recherche'}
                    </p>
                  </Card>
                )}

                {hasMore && !showingMatches && (
                  <div className="mt-4 text-center">
                    <Button
                      onClick={async () => {
                        const next = page + 1;
                        setPage(next);
                        await fetchJobs({ page: next, append: true });
                      }}
                    >
                      Charger plus
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Sidebar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">Activité récente</h3>
              </div>
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full ${activity.color} mt-1.5 flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.subtext}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 gap-2">
                Voir toute l'activité
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;