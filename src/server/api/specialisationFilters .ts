import { SpecializationFilter } from '@workquest/database-models/lib/models';

export async function getMapSpecialisations(r) {
  const specialisations = await SpecializationFilter.findAll();
}
