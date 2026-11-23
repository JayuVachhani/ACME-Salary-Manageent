# 10,000-employee performance results

23 November 2026. **Partial engineering qualification, not production acceptance.** The merged payroll implementation processed 10,000 synthetic employees through preparation, independent approvals and finalization without unexpected HTTP failures. The baseline missed two interactive latency targets. A measured draft-list optimization fixed one; the finalized-payslip target miss remains recorded.

## Workload and isolation

Real compiled Nest HTTP, PostgreSQL on preserved test port55432, restricted runtime role, normal DTO/authentication/CSRF/lease/approval/audit/database guards. Each run creates an unpredictable `acme_perf_` database, migrates it, and drops only that database after completion. Installed acme_app5432, existing employee/demo records and credentials were not changed. The ordinary demo seed restriction was not loosened.

Dataset:10,000 workforce employees,10,000 independently approved initial salaries,10,000 manual monthly drafts, plus isolated fixture actors/support employees. Each workforce employee has one salary entry; long historical ledgers are not qualified. Approved synthetic India/INR policy uses explicit fixture settings, not jurisdictional compliance facts. Warm-up10 requests; pages25/100; payroll batches100. Read tests use1/10/25 distinct HR users; calculations and baseline payslip bursts use one HR session. Transactional authorization deliberately serializes same-account activity.

Environment: Windows,Node24.20.0,8 available CPUs,8GB RAM; API,load generator and PostgreSQL share the host. Pool maximum10,statement timeout5seconds. Local developer services/compiler activity were not controlled. Results are one full baseline, one optimized read pass overlapping baseline payroll activity, and one optimized read pass after that activity ended. This is not a clean dedicated-host repeated statistical study,production sizing,failover test or long soak.

## Results

Engineering targets selected for diagnosis: interactive p95≤1,000ms;100-person batch p95≤10,000ms; zero unexpected errors. These are not approved business SLAs. Expected lease conflicts are excluded from failure counts.

| Operation | Baseline p95 ms | Optimized quiet read p95 ms |
| --- | ---: | ---: |
| Salary workspace,1 reader |74.28|248.88|
| Salary workspace,10 readers |561.15|844.67|
| Salary workspace,25 readers |507.25|823.31|
| Directory search/deep pages,10 readers |253.03|459.72|
| Salary history,10 readers |71.11|191.36|
| Manual draft pages,10 readers |1,030.42|486.07|
| Calculation preview,10 concurrent requests |367.92|281.97|
| Create100-person payroll run |1,161.73|Not repeated|
| Four review/finalization actions per100-person run |9,356.15|Not repeated|
| Finalized payslip pages,10 concurrent requests |1,124.41|Not repeated|

Baseline preparation:100 runs covering10,000 employees in89.38seconds. HR→Finance→Director→finalization:635.05seconds for100 runs,with exactly10,000 finalized allocations. These stages total about12.1minutes,excluding fixture setup and other tests. They simulate approved actions through the API,not the time humans need to review. Ten competing edit acquisitions produced exactly one winner and nine expected423 lock responses; no lock/authorization protection was relaxed.

All timed scenarios checked response status and data/count/amount invariants. Baseline correctness passed; its process exited nonzero for the draft/payslip latency misses. Optimized concurrent reads had no unexpected errors but missed salary-search-c10 at1,160.91ms. Optimized quiet reads passed every measured p95 gate with no unexpected errors. The quiet draft p95 decreased about53%; unrelated paths were slower on that pass,demonstrating host variability rather than a system-wide improvement.

Baseline sampled peak RSS410.7MB,heap276.5MB,event-loop p95 24.54ms,max1,262.49ms,pool waiters15. Quiet read pass:RSS191.9MB,heap93.1MB,event-loop p95 34.41ms,max114.56ms,pool waiters15;process CPU37.65% of one core,event-loop utilization0.3118. API/load generator share the process,so these are not standalone server resource requirements. Raw p50/p95/p99,max,throughput,sample counts,resources and gate outcomes: [results](PERFORMANCE_10K_RESULTS.json).

## Optimization and correctness

EXPLAIN identified10,000 repeated employee index probes in the broad draft list,and a second count query repeating eligibility. PayrollDraftsService.list now materializes live IDs and a shared narrow eligibility set,counts it once,then fetches full immutable financial snapshots for just25 rows. Search escaping,removed-employee privacy,sorting,page totals,exact decimal strings and response shape remain. No schema/migration,permission,pool-size,timeout or financial rule changed.

Post-change checks: backend lint/types/native build and27 units passed; all7 real PostgreSQL/Nest HTTP regression groups passed,including added draft-search exact values/counts/timestamps and empty-page assertions. The optimized read passes exercise the changed list at10,000 employees. They do not repeat full finalization on the changed source; finalization code was unchanged. No new browser/performance UX timing pass is claimed.

## Reproduce

Build backend with the supported Node runtime. Supply a deliberately isolated loopback55432 migration-owner/runtime environment plus the normal synthetic app/SMTP configuration; do not point it at installed application data. The benchmark refuses another host/port and creates/drops its own random database. It does not load backend/.env automatically.

From backend,`npm run test:performance:10k` executes the full workload. `npm run test:performance:10k -- --reads-only` rechecks read/calculation/lease paths only and cannot establish lifecycle throughput. On this configured machine,the ignored `.local/run-isolated-verification.mjs` wrapper supplies the preserved test-cluster environment. Metrics/query plans/logs remain under ignored backend/.local/performance-10k; the committed results contain only synthetic aggregate diagnostics.

## Remaining qualification

Finalized payslip p95 target remains missed in the baseline. Same-account authorization queues,p99 tails,pool saturation,mixed sustained workload,multiple historical entries per employee,15k volume and dedicated deployment sizing need further measurement. Do not claim all latency targets,production capacity or10,000 simultaneous users. After reviewing these partial results,the user authorized a local commit on chore/payroll-10k-performance. Push/publication was not requested. Latency misses remain recorded and are not relabelled as passes.
