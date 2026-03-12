-- Optional tightening: limit custom badge labels to 8 chars

begin;

alter table public.member_badges
  drop constraint if exists member_badges_custom_label_len;

alter table public.member_badges
  add constraint member_badges_custom_label_len
  check (custom_label is null or char_length(custom_label) between 1 and 8);

commit;
