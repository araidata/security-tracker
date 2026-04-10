"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { DEPARTMENT_CONFIG, ROLE_CONFIG } from "@/lib/constants";
import { cn, formatDate, getInitials } from "@/lib/utils";

type Role = keyof typeof ROLE_CONFIG;
type Department = keyof typeof DEPARTMENT_CONFIG;

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: Department;
  createdAt: string;
  _count: {
    ownedGoals: number;
    ownedRocks: number;
    assignments: number;
  };
};

type UserFormState = {
  name: string;
  email: string;
  role: Role;
  department: Department;
  password: string;
};

const EMPTY_FORM_STATE: UserFormState = {
  name: "",
  email: "",
  role: "CONTRIBUTOR",
  department: "SEC_OPS",
  password: "",
};

const ROLE_ORDER: Role[] = ["EXECUTIVE", "MANAGER", "CONTRIBUTOR"];
const DEPARTMENT_OPTIONS = Object.entries(DEPARTMENT_CONFIG) as [
  Department,
  (typeof DEPARTMENT_CONFIG)[Department],
][];
const ROLE_OPTIONS = Object.entries(ROLE_CONFIG) as [
  Role,
  (typeof ROLE_CONFIG)[Role],
][];

function sortUsers(users: AdminUser[]) {
  return [...users].sort((left, right) => {
    const roleDelta =
      ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role);

    if (roleDelta !== 0) {
      return roleDelta;
    }

    return left.name.localeCompare(right.name);
  });
}

function buildFormState(user?: AdminUser): UserFormState {
  if (!user) {
    return EMPTY_FORM_STATE;
  }

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    password: "",
  };
}

function getErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    Array.isArray(payload.error) &&
    payload.error.length > 0
  ) {
    const firstIssue = payload.error[0];

    if (
      firstIssue &&
      typeof firstIssue === "object" &&
      "message" in firstIssue &&
      typeof firstIssue.message === "string"
    ) {
      return firstIssue.message;
    }
  }

  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "Unable to save user.";
}

export function UsersWorkspace({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(() => sortUsers(initialUsers));
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formState, setFormState] = useState<UserFormState>(EMPTY_FORM_STATE);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = selectedUserId !== null;

  function handleCreateMode() {
    setSelectedUserId(null);
    setFormState(EMPTY_FORM_STATE);
    setError("");
    setMessage("");
  }

  function handleEditUser(user: AdminUser) {
    setSelectedUserId(user.id);
    setFormState(buildFormState(user));
    setError("");
    setMessage("");
  }

  function handleFieldChange(
    field: keyof UserFormState,
    value: string
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        isEditing ? `/api/users/${selectedUserId}` : "/api/users",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formState),
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      const savedUser = payload as AdminUser;

      setUsers((current) =>
        sortUsers(
          isEditing
            ? current.map((user) => (user.id === savedUser.id ? savedUser : user))
            : [...current, savedUser]
        )
      );

      startTransition(() => {
        router.refresh();
      });

      if (savedUser.id === currentUserId) {
        await signOut({ callbackUrl: "/login" });
        return;
      }

      if (isEditing) {
        setSelectedUserId(savedUser.id);
        setFormState(buildFormState(savedUser));
        setMessage("User updated.");
      } else {
        setFormState(EMPTY_FORM_STATE);
        setMessage("User created.");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save user."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,380px),minmax(0,1fr)]">
      <section className="card h-fit space-y-5 xl:sticky xl:top-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{isEditing ? "Edit User" : "Add User"}</p>
            <h2 className="mt-2 text-xl font-semibold text-text-primary">
              {isEditing ? formState.name || "Update team member" : "Create a new team member"}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {isEditing
                ? "Update access, ownership alignment, and contact details."
                : "Add a new login with the right department and role from day one."}
            </p>
          </div>
          {isEditing ? (
            <button
              type="button"
              onClick={handleCreateMode}
              className="btn-secondary px-3"
            >
              <XMarkIcon className="mr-1.5 h-4 w-4" />
              New
            </button>
          ) : null}
        </div>

        {message ? (
          <div className="rounded-2xl border border-status-on-track/20 bg-status-on-track/10 px-4 py-3 text-sm text-status-on-track">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-status-off-track/20 bg-status-off-track/10 px-4 py-3 text-sm text-status-off-track">
            {error}
          </div>
        ) : null}

        {selectedUserId === currentUserId ? (
          <div className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-text-secondary">
            Saving changes to your own account signs you out so the session refreshes with the new profile and permissions.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Name
            </label>
            <input
              value={formState.name}
              onChange={(event) => handleFieldChange("name", event.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Email
            </label>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => handleFieldChange("email", event.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Role
              </label>
              <select
                value={formState.role}
                onChange={(event) => handleFieldChange("role", event.target.value)}
                className="input-field"
              >
                {ROLE_OPTIONS.map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Department
              </label>
              <select
                value={formState.department}
                onChange={(event) =>
                  handleFieldChange("department", event.target.value)
                }
                className="input-field"
              >
                {DEPARTMENT_OPTIONS.map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              {isEditing ? "Reset Password" : "Temporary Password"}
            </label>
            <input
              type="password"
              value={formState.password}
              onChange={(event) =>
                handleFieldChange("password", event.target.value)
              }
              className="input-field"
              required={!isEditing}
              minLength={8}
              placeholder={
                isEditing ? "Leave blank to keep the current password" : "At least 8 characters"
              }
            />
            <p className="mt-2 text-xs text-text-tertiary">
              {isEditing
                ? "Only fill this in when you want to rotate the user's password."
                : "Share this securely with the new user after creating the account."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create User"}
            </button>
            {isEditing ? (
              <button
                type="button"
                onClick={handleCreateMode}
                disabled={submitting}
                className="btn-secondary"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="table-shell overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="eyebrow">Team Directory</p>
            <p className="mt-2 text-sm text-text-secondary">
              {users.length} active users with ownership counts across goals, rocks, and assignments.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateMode}
            className="btn-secondary px-3"
          >
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Add User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Goals</th>
                <th className="px-4 py-3 text-left">Rocks</th>
                <th className="px-4 py-3 text-left">Tasks</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-text-tertiary"
                  >
                    No users yet. Create the first team member from the form.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      "table-row",
                      user.id === selectedUserId && "table-row-selected"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {user.name}
                            {user.id === currentUserId ? (
                              <span className="ml-2 text-xs font-normal text-text-tertiary">
                                (You)
                              </span>
                            ) : null}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-background-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary">
                        {ROLE_CONFIG[user.role].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DepartmentBadge department={user.department} />
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {user._count.ownedGoals}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {user._count.ownedRocks}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {user._count.assignments}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-tertiary">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleEditUser(user)}
                        className="btn-secondary px-3 py-2 text-xs"
                      >
                        <PencilSquareIcon className="mr-1.5 h-4 w-4" />
                        {user.id === selectedUserId ? "Editing" : "Edit"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
