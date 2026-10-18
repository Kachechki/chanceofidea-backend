export interface ISearchProjects {
    categorySlugs: string[] | string;
    tagSlugs: string[] | string;
    searchQuery?: string;
    page: number;
}