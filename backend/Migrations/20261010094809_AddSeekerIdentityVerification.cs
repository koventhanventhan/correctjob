using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireConnect.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSeekerIdentityVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdCardBackUrl",
                table: "SeekerProfiles",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "IdCardFrontUrl",
                table: "SeekerProfiles",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "VerificationNotes",
                table: "SeekerProfiles",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "VerificationStatus",
                table: "SeekerProfiles",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "VerifiedAt",
                table: "SeekerProfiles",
                type: "datetime(6)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IdCardBackUrl",
                table: "SeekerProfiles");

            migrationBuilder.DropColumn(
                name: "IdCardFrontUrl",
                table: "SeekerProfiles");

            migrationBuilder.DropColumn(
                name: "VerificationNotes",
                table: "SeekerProfiles");

            migrationBuilder.DropColumn(
                name: "VerificationStatus",
                table: "SeekerProfiles");

            migrationBuilder.DropColumn(
                name: "VerifiedAt",
                table: "SeekerProfiles");
        }
    }
}
