import { userService } from "@/services/user.service";
import { useQuery } from "@tanstack/react-query";

export const userKeys = {
    all: ['users'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
};

export function useUser(id: string) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => userService.getUser(id),
        enabled: !!id,
    });
}