export type ModelRecord = {
  path: string;
  industryKey: string;
  specializationKey: string;
  [alias: string]: string;
};

export type MapSpecialization = { [specialization: string]: string };
export type MapIndustry = { [industry: string]: MapSpecialization };
export type MapIndustryAndSpecialization = { [industryWithSpecialization: string]: string };
