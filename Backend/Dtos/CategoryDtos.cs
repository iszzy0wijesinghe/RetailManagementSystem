namespace RetailManagementSystem.Dtos
{
    public record CategoryCreateDto(
        string Name, 
        long? ParentCategoryId);
    public record CategoryUpdateDto(
        string Name, 
        long? ParentCategoryId);

   
    public record CategoryListItem(
        long CategoryId, 
        string Name, 
        bool IsActive, 
        long? ParentCategoryId);


    public record CategoryDetailsDto(
        long CategoryId, 
        string Name, 
        bool IsActive, 
        long? ParentCategoryId);
}
