import type { Database } from "@/types/database";
import type { UserRole } from "@/lib/constants/roles";

export type Profile = Omit<
  Database["public"]["Tables"]["profiles"]["Row"],
  "role"
> & {
  role: UserRole;
};
