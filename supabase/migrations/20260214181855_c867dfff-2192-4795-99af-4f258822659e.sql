
-- Create function for duplicate detection based on proximity
CREATE OR REPLACE FUNCTION public.find_nearby_issues(
  p_latitude double precision,
  p_longitude double precision,
  p_title text,
  p_radius_km double precision DEFAULT 0.5
)
RETURNS TABLE(
  id uuid,
  title text,
  issue_type issue_type,
  status issue_status,
  latitude double precision,
  longitude double precision,
  address text,
  distance_km double precision,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    i.id,
    i.title,
    i.issue_type,
    i.status,
    i.latitude,
    i.longitude,
    i.address,
    (6371 * acos(
      cos(radians(p_latitude)) * cos(radians(i.latitude)) *
      cos(radians(i.longitude) - radians(p_longitude)) +
      sin(radians(p_latitude)) * sin(radians(i.latitude))
    )) as distance_km,
    i.created_at
  FROM public.issues i
  WHERE i.status NOT IN ('resolved', 'withdrawn')
    AND (6371 * acos(
      cos(radians(p_latitude)) * cos(radians(i.latitude)) *
      cos(radians(i.longitude) - radians(p_longitude)) +
      sin(radians(p_latitude)) * sin(radians(i.latitude))
    )) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT 10;
$$;
