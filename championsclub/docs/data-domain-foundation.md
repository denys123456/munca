# Data and Domain Foundation

This milestone removes prototype assumptions that would make later data, ML and dashboard work inconsistent.

## Completed changes

- replaced the old `SALES_ADVISOR` role with `ADVISOR`
- introduced `AdvisorType.SALES` and `AdvisorType.SERVICE`
- removed the Admin application role
- moved dealership ownership out of the old generic configuration feature
- moved point rule ownership into the points feature
- moved gamification threshold ownership into the gamification feature
- replaced the generic configuration store with feature-specific repositories
- introduced financial product advisor scope
- renamed `financedAmount` to `contractAmount`
- separated `availablePoints` from `lifetimeEarnedPoints`
- based Bronze, Silver and Gold progress on lifetime sale progress
- allowed auditable sale reversal after reward spending
- updated authorization to the Advisor and Manager model
- updated targets so Managers can manage targets only within their dealership
- updated analytics so mixed Sales and Service Advisor ranking uses target achievement rather than raw contract volume
- added a read-only authenticated financial product catalogue endpoint
- aligned the local demo scenario with the new domain model

## Deferred deliberately

The large realistic synthetic dataset is not hidden inside this milestone. It is the next dedicated phase because its distributions must be researched, generated and validated before it becomes the canonical source for analytics and ML.

Full live frontend integration is also deferred to the integration milestone. The current frontend demo workspace has been aligned with the new domain vocabulary but remains a presentation fallback until API integration is completed.
