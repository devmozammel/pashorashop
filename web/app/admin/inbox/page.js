import AdminShell from "@/components/admin/AdminShell";
import SocialInboxWorkspace from "@/components/admin/inbox/SocialInboxWorkspace";

export default function AdminInboxPage() {
    return (
        <AdminShell title="Social Commerce Inbox" fullBleed>
            <SocialInboxWorkspace />
        </AdminShell>
    );
}
