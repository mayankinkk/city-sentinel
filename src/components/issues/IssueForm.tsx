import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateIssue } from '@/hooks/useIssues';
import { useAuth } from '@/hooks/useAuth';
import { IssueType, IssuePriority, issueTypeLabels, issueTypeIcons, priorityLabels } from '@/types/issue';
import { supabase } from '@/integrations/supabase/client';
import { LocationPicker } from '@/components/map/LocationPicker';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { stripExifData } from '@/lib/imageUtils';
import { toast } from 'sonner';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';
import { DuplicateWarning } from '@/components/issues/DuplicateWarning';

const issueSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description must be less than 1000 characters'),
  issue_type: z.enum(['pothole', 'streetlight', 'drainage', 'garbage', 'graffiti', 'sidewalk', 'traffic_sign', 'water_leak', 'other'] as const),
  priority: z.enum(['low', 'medium', 'high'] as const),
});

type IssueFormData = z.infer<typeof issueSchema>;

export function IssueForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createIssue = useCreateIssue();
  
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { nearbyIssues, isChecking, checkDuplicates } = useDuplicateDetection();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      issue_type: 'other',
      priority: 'medium',
    },
  });

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          
          // Reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            if (data.display_name) {
              setAddress(data.display_name);
            }
          } catch (error) {
            console.error('Failed to get address:', error);
          }
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Could not get your location. Please select it on the map.');
          // Set default location (Delhi, India)
          setLatitude(28.6139);
          setLongitude(77.209);
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setLatitude(28.6139);
      setLongitude(77.209);
      setIsLocating(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    // Trigger duplicate check when location changes
    const title = watch('title');
    if (title && title.length > 3) {
      checkDuplicates(lat, lng, title);
    }
  };

  // Check duplicates when title changes significantly
  const handleTitleBlur = useCallback(() => {
    const title = watch('title');
    if (latitude && longitude && title && title.length > 3) {
      checkDuplicates(latitude, longitude, title);
    }
  }, [latitude, longitude, watch, checkDuplicates]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    
    // Strip EXIF metadata for privacy (removes GPS, device info, etc.)
    const strippedImage = await stripExifData(imageFile);
    
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `issues/${fileName}`;

    const { error } = await supabase.storage
      .from('issue-images')
      .upload(filePath, strippedImage);

    if (error) {
      throw new Error('Failed to upload image');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('issue-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: IssueFormData) => {
    if (!latitude || !longitude) {
      toast.error('Location is required. Please select it on the map.');
      return;
    }
    
    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions.');
      return;
    }

    try {
      setIsUploading(true);
      let imageUrl: string | undefined;
      
      if (imageFile) {
        imageUrl = (await uploadImage()) ?? undefined;
      }

      await createIssue.mutateAsync({
        title: data.title,
        description: data.description,
        issue_type: data.issue_type,
        priority: data.priority,
        latitude,
        longitude,
        address: address || undefined,
        image_url: imageUrl,
        reporter_id: user?.id,
        reporter_email: user?.email,
      });

      navigate('/issues');
    } catch (error) {
      console.error('Failed to create issue:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Report an Issue
        </CardTitle>
        <CardDescription>
          Help improve your city by reporting infrastructure problems
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Location Picker Map */}
          <div className="space-y-2">
            <Label>Location</Label>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={handleLocationChange}
              onAddressChange={handleAddressChange}
              isLocating={isLocating}
              onLocate={getLocation}
            />
            {address && (
              <p className="text-sm text-muted-foreground truncate">{address}</p>
            )}
          </div>

          {/* Issue Type */}
          <div className="space-y-2">
            <Label htmlFor="issue_type">Issue Type</Label>
            <Select
              value={watch('issue_type')}
              onValueChange={(value) => setValue('issue_type', value as IssueType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(issueTypeLabels) as IssueType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span>{issueTypeIcons[type]}</span>
                      {issueTypeLabels[type]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the issue (minimum 20 characters)"
              rows={4}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={watch('priority')}
              onValueChange={(value) => setValue('priority', value as IssuePriority)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(priorityLabels) as IssuePriority[]).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priorityLabels[priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Photo Evidence (Optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG up to 5MB
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    GPS &amp; device data will be removed
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(!!checked)}
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              I agree to the Terms and Conditions. I confirm that the information provided is accurate and I understand that false reports may result in account suspension.
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full"
            disabled={isSubmitting || isUploading || !latitude || !longitude || !termsAccepted}
          >
            {(isSubmitting || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting || isUploading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
