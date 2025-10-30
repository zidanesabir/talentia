import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Briefcase, 
  Clock, 
  DollarSign, 
  GraduationCap,
  MapPin,
  Building2,
  Globe
} from "lucide-react";

const JobDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const api = await import('@/lib/api');
        const data = await api.getJob(id);
        // Get match score from navigation state or use 0
        const matchScoreFromState = (location.state as any)?.matchScore || 0;
        // map to UI shape with safe defaults
        setJob({
          title: data.title || 'Offre',
          company: data.company || '',
          location: data.location || '',
          type: data.type || data.contract || '',
          workTime: data.workTime || '',
          salary: data.salary || data.remuneration || '',
          education: data.education || '',
          matchScore: matchScoreFromState || data.matchScore || 0,
          description: data.description || data.summary || '',
          responsibilities: data.responsibilities || [],
          requirements: data.requirements || [],
          companyInfo: data.companyInfo || '',
          website: data.url || '',
          skills: Array.isArray(data.skills) ? data.skills.map((s: any) => (typeof s === 'string' ? { name: s, match: 0 } : s)) : [],
        });
      } catch (e) {
        console.error('Failed to load job', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, location]);

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-info";
    return "bg-warning";
  };

  const tabs = [
    { id: "description", label: "Description" },
    { id: "competences", label: "Compétences" },
    { id: "entreprise", label: "Entreprise" },
    { id: "avantages", label: "Avantages" },
  ];

  // Show loading state while fetching
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de l'offre...</p>
        </div>
      </div>
    );
  }

  // Show error state if job not found
  if (!job) {
    return (
      <div className="min-h-screen bg-secondary">
        <header className="bg-card border-b border-border p-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-accent hover:underline mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux offres
            </button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">
          <Card className="p-8 text-center">
            <p className="text-lg text-muted-foreground mb-4">Offre non trouvée</p>
            <Button onClick={() => navigate("/dashboard")}>Retour au tableau de bord</Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-accent hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux offres
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="col-span-2 space-y-6">
            {/* Job Header */}
            <Card className="p-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl font-bold text-primary">{String(job.company || '').substring(0, 2).toUpperCase()}</span>
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">{job.title}</h1>
                  <p className="text-lg text-muted-foreground mb-4">
                    {job.company} • {job.location}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      {job.type}
                    </Badge>
                    <Badge variant="secondary" className="gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {job.workTime}
                    </Badge>
                    <Badge variant="secondary" className="gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      {job.salary}
                    </Badge>
                    <Badge variant="secondary" className="gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {job.education}
                    </Badge>
                  </div>
                </div>

                <div className="text-center">
                  <div className={`${getMatchColor(job.matchScore)} text-white px-6 py-4 rounded-xl`}>
                    <div className="text-4xl font-bold">{job.matchScore}%</div>
                    <div className="text-sm mt-1">Match Score</div>
                  </div>
                  <Button className="w-full mt-4">
                    Postuler maintenant
                  </Button>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <Card className="p-6">
              <div className="flex gap-4 border-b border-border mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
                      tab.id === "description"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-3">À propos du poste</h2>
                  <p className="text-foreground leading-relaxed">{job.description}</p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-3">Responsabilités</h2>
                  <ul className="space-y-2">
                    {job.responsibilities.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-foreground">
                        <span className="text-primary mt-1.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-3">Profil recherché</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-foreground">
                        <span className="text-primary mt-1.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-secondary p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">À propos de TechCorp</h3>
                  <p className="text-foreground mb-2">{job.companyInfo}</p>
                  {job.website && (
                    <a
                      href={job.website.startsWith('http') ? job.website : `https://${job.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-4 h-4" />
                      {job.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Skills Match */}
          <div>
            <Card className="p-6 sticky top-6">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Correspondance des compétences
              </h3>

              <div className="space-y-4">
                {job.skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{skill.name}</span>
                      <span className="text-sm font-bold text-foreground">{skill.match}%</span>
                    </div>
                    <Progress 
                      value={skill.match} 
                      className="h-2"
                      // @ts-ignore - custom color prop
                      indicatorClassName={getMatchColor(skill.match)}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-bold text-foreground mb-3">À propos de TechCorp</h4>
                <p className="text-sm text-foreground mb-3">{job.companyInfo}</p>
                {job.website && (
                  <a
                    href={job.website.startsWith('http') ? job.website : `https://${job.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline flex items-center gap-1"
                  >
                    <Globe className="w-4 h-4" />
                    {job.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JobDetail;
