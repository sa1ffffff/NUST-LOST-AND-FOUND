import { CheckCircle2, MapPin, Calendar, Phone } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FoundItem {
  id: string;
  title: string;
  description: string | null;
  location: string;
  date_found: string;
  contact: string | null;
  image_url: string | null;
}

interface Match {
  foundItem: FoundItem;
  score: number;
}

interface MatchResultsProps {
  matches: Match[];
  onClose: () => void;
}

const MatchResults = ({ matches, onClose }: MatchResultsProps) => {
  if (matches.length === 0) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center animate-scale-in">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Item Reported</h3>
          <p className="text-muted-foreground mb-6">
            We couldn't find any matches right now, but we'll notify you if something similar is found.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Got it
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-4xl w-full my-8">
        <Card className="p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Great News!</h2>
            <p className="text-muted-foreground text-lg">
              We found {matches.length} potential {matches.length === 1 ? 'match' : 'matches'} for your lost item
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {matches.map((match, index) => (
              <div
                key={match.foundItem.id}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-accent/50 transition-all duration-300 hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Match score badge */}
                <Badge 
                  className={`absolute top-4 right-4 ${
                    match.score >= 70 
                      ? 'bg-accent text-accent-foreground' 
                      : match.score >= 50 
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {match.score}% Match
                </Badge>

                <div className="flex gap-6">
                  {/* Image */}
                  {match.foundItem.image_url && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={match.foundItem.image_url}
                        alt={match.foundItem.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold mb-2 text-foreground">
                      {match.foundItem.title}
                    </h3>
                    
                    {match.foundItem.description && (
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {match.foundItem.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{match.foundItem.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Found on {format(new Date(match.foundItem.date_found), 'MMM dd, yyyy')}</span>
                      </div>
                      
                      {match.foundItem.contact && (
                        <div className="flex items-center gap-2 text-accent">
                          <Phone className="w-4 h-4" />
                          <span className="font-medium">{match.foundItem.contact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Close
            </button>
            <p className="text-sm text-muted-foreground mt-4">
              We'll notify you if more matches are found in the future
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MatchResults;