"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  userId: string;
  className?: string;
}

export function FollowButton({ userId, className }: FollowButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${userId}/follow`)
      .then((r) => r.json())
      .then((data) => {
        setIsFollowing(data.isFollowing);
        setFollowers(data.followers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const toggle = async () => {
    if (!isSignedIn) {
      router.push("/signin");
      return;
    }
    setToggling(true);
    const prev = { isFollowing, followers };
    setIsFollowing(!isFollowing);
    setFollowers((c) => (isFollowing ? c - 1 : c + 1));
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
      } else {
        setIsFollowing(prev.isFollowing);
        setFollowers(prev.followers);
      }
    } catch {
      setIsFollowing(prev.isFollowing);
      setFollowers(prev.followers);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      size="sm"
      onClick={toggle}
      disabled={toggling}
      className={className}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-1.5" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1.5" />
          Follow
        </>
      )}
      {followers > 0 && (
        <span className="ml-1.5 text-xs opacity-70">
          · {followers}
        </span>
      )}
    </Button>
  );
}
