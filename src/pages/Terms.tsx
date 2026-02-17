import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions - City Sentinel</title>
        <meta name="description" content="Terms and Conditions for using City Sentinel platform." />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>

        <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
          <li><strong className="text-foreground">Accuracy:</strong> All information submitted must be truthful and accurate to the best of your knowledge.</li>
          <li><strong className="text-foreground">No False Reports:</strong> Submitting false, misleading, or spam reports may result in immediate account suspension or permanent ban.</li>
          <li><strong className="text-foreground">Privacy:</strong> GPS and device metadata are automatically stripped from uploaded images. Your location data is used solely for issue mapping.</li>
          <li><strong className="text-foreground">Content Ownership:</strong> By uploading photos, you grant City Sentinel a non-exclusive license to use them for issue resolution and public display.</li>
          <li><strong className="text-foreground">No Guarantees:</strong> Reporting an issue does not guarantee resolution within a specific timeframe. Resolution depends on municipal authorities.</li>
          <li><strong className="text-foreground">Respectful Use:</strong> Offensive, abusive, or inappropriate content in reports or comments will be removed and may lead to account action.</li>
          <li><strong className="text-foreground">Data Retention:</strong> Reports and associated data are retained for public transparency and may be anonymized for analytics.</li>
        </ol>

        <p className="text-xs text-muted-foreground/60 mt-10">© {new Date().getFullYear()} City Sentinel. All rights reserved.</p>
      </div>
    </>
  );
}
