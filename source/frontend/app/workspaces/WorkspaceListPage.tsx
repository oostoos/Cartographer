// @manualReviewRequested: 2026-07-07
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Card } from "../../core/design-system/components/Card";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { List } from "../../core/design-system/components/List";
import { MasterDetailLayout } from "../../core/design-system/components/MasterDetailLayout";
import { blockColorStrongVar } from "../blocks/blockColor";
import { WorkspaceCreateModal } from "./WorkspaceCreateModal";
import { WorkspaceDetailPane } from "./WorkspaceDetailPane";
import { useWorkspaces } from "./useWorkspaces";
import "./WorkspaceListPage.css";

const WORKSPACES_GROUP_KEY = "workspaces";

/** Lists every workspace in the sidebar (flat — a workspace has no nesting concept, unlike a
 * project) with a detail pane aggregating its associated tasks/projects/notes/blocks. New
 * workspaces are created via WorkspaceCreateModal.
 */
export function WorkspaceListPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    () => (location.state as { workspaceId?: string } | null)?.workspaceId ?? null,
  );

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const selectedWorkspace =
    workspaces?.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;

  return (
    <div className="cg-workspace-list-page">
      <h1>
        Workspaces <EmojiIcon symbol="🗂️" label="Workspaces" />
      </h1>
      <MasterDetailLayout
        list={
          <Card className="cg-sidebar">
            <div className="cg-sidebar__create">
              <WorkspaceCreateModal onCreated={setSelectedWorkspaceId} />
            </div>
            <List
              groups={[{ key: WORKSPACES_GROUP_KEY, items: workspaces ?? [] }]}
              getId={(workspace) => workspace.id}
              getLabel={(workspace) => workspace.title}
              renderLeading={(workspace) => (
                <span
                  className="cg-workspace-list-page__dot"
                  style={{
                    backgroundColor: blockColorStrongVar(Number(workspace.color || "1") - 1),
                  }}
                />
              )}
              selectedId={selectedWorkspaceId}
              onSelect={setSelectedWorkspaceId}
              emptyMessage={isLoading ? "Loading workspaces…" : "No workspaces yet."}
            />
          </Card>
        }
        detail={
          selectedWorkspace && (
            <WorkspaceDetailPane
              workspace={selectedWorkspace}
              onDeleted={() => setSelectedWorkspaceId(null)}
            />
          )
        }
        onCloseDetail={() => setSelectedWorkspaceId(null)}
      />
    </div>
  );
}
