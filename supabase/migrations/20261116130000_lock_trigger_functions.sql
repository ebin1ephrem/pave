-- Trigger-only functions need no direct execute right. Access helpers stay callable: the policies use them.
revoke execute on function
  public.handle_new_user(),
  public.create_enrollment_checkpoints(),
  public.mark_checkpoint_started(),
  public.check_program_manager_tenant(),
  public.check_override_matches_score(),
  public.write_audit_log(),
  public.set_updated_at(),
  public.forbid_update(),
  public.stamp_evidence_review()
from authenticated, service_role, public, anon;
