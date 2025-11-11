using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetailManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class Refactor_InventoryItem_ToSeparatePk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_InventoryItems",
                table: "InventoryItems");

            migrationBuilder.AddColumn<long>(
                name: "InventoryItemId",
                table: "InventoryItems",
                type: "bigint",
                nullable: false,
                defaultValue: 0L)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddPrimaryKey(
                name: "PK_InventoryItems",
                table: "InventoryItems",
                column: "InventoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryItems_ProductId",
                table: "InventoryItems",
                column: "ProductId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_InventoryItems",
                table: "InventoryItems");

            migrationBuilder.DropIndex(
                name: "IX_InventoryItems_ProductId",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "InventoryItemId",
                table: "InventoryItems");

            migrationBuilder.AddPrimaryKey(
                name: "PK_InventoryItems",
                table: "InventoryItems",
                column: "ProductId");
        }
    }
}
