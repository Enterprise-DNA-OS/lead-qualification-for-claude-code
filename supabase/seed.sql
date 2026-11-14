DO $$ begin
 if exists(select 1 from contacts) or exists(select 1 from models) then return; end if;
 insert into models(id,name,active,policy) values('10000000-0000-4000-8000-000000000001','ANZ demo v1',true,
 '{"industries":["software","professional services"],"countries":["NZ","AU"],"employees_min":10,"employees_max":200,"fit_points":{"industry":40,"country":25,"employees":35},"event_points":{"demo_requested":60,"trial_started":30,"pricing_viewed":15,"active_day":5,"meeting_held":40},"lookback_days":30,"accuracy_days":90,"fit_weight":0.5,"priority_threshold":60}');
 insert into contacts(id,email,name,company,industry,country,employees,owner,purpose,purpose_evidence,accuracy_checked_at,retain_until,suppressed) values
 ('20000001-0000-4000-8000-000000000001','rae@harbour.example','Rae Taylor','Harbour Systems','software','NZ',35,'Morgan','Assess requested demonstration','Synthetic form DEMO-101',now()-interval '2 days',current_date+180,false),
 ('20000002-0000-4000-8000-000000000002','rae@fern.example','Rae Wilson','Fern Advisory','professional services','AU',24,'Morgan','Review trial suitability','Synthetic trial TRIAL-202',now()-interval '6 days',current_date+120,false),
 ('20000003-0000-4000-8000-000000000003','alex@ridge.example','Alex Chen','Ridge Works','manufacturing','NZ',80,'Jules','','',now()-interval '120 days',current_date-3,false),
 ('20000004-0000-4000-8000-000000000004','lee@south.example','Lee Singh','South Platform','software','AU',60,'Jules','Existing enquiry review','Synthetic enquiry E-404',now()-interval '5 days',current_date+90,true),
 ('20000005-0000-4000-8000-000000000005','sam@bay.example','Sam Patel','Bay Studio','design','NZ',6,'','Review requested information','Synthetic enquiry E-505',now()-interval '10 days',current_date+60,false);
 insert into events(event_key,contact_id,kind,occurred_at,evidence,actor) values
 ('demo-1','20000001-0000-4000-8000-000000000001','demo_requested',now()-interval '1 day','Synthetic submitted demonstration request','Demo seed'),
 ('demo-2','20000001-0000-4000-8000-000000000001','pricing_viewed',now()-interval '2 days','Synthetic first-party observation','Demo seed'),
 ('demo-3','20000002-0000-4000-8000-000000000002','trial_started',now()-interval '45 days','Synthetic old trial event','Demo seed'),
 ('demo-4','20000004-0000-4000-8000-000000000004','demo_requested',now()-interval '3 days','Synthetic prior request, now suppressed','Demo seed');
 insert into notes(contact_id,body,actor) values('20000004-0000-4000-8000-000000000004','Synthetic opt-out recorded. Do not put on the handover list.','Demo seed');
end $$;
