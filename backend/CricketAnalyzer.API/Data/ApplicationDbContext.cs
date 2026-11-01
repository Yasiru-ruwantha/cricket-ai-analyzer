using Microsoft.EntityFrameworkCore;
using CricketAnalyzer.API.Models;

namespace CricketAnalyzer.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<BattingPerformance> BattingPerformances => Set<BattingPerformance>();
    public DbSet<BowlingPerformance> BowlingPerformances => Set<BowlingPerformance>();
    public DbSet<PlayerStatistics> PlayerStatistics => Set<PlayerStatistics>();
    public DbSet<AIAnalysis> AIAnalyses => Set<AIAnalysis>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Users
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Username).IsUnique();
        });

        // Players
        modelBuilder.Entity<Player>(entity =>
        {
            entity.HasIndex(p => p.Name);
            entity.HasIndex(p => p.Country);
            entity.HasIndex(p => p.ExternalApiId);
        });

        // Matches
        modelBuilder.Entity<Match>(entity =>
        {
            entity.HasIndex(m => m.MatchDate);
            entity.HasIndex(m => m.ExternalMatchId);
        });

        // Batting Performances
        modelBuilder.Entity<BattingPerformance>(entity =>
        {
            entity.Property(b => b.StrikeRate)
                  .HasPrecision(6, 2);

            entity.HasOne(b => b.Player)
                  .WithMany(p => p.BattingPerformances)
                  .HasForeignKey(b => b.PlayerId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.Match)
                  .WithMany(m => m.BattingPerformances)
                  .HasForeignKey(b => b.MatchId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Bowling Performances
        modelBuilder.Entity<BowlingPerformance>(entity =>
        {
            entity.Property(b => b.OversBowled)
                  .HasPrecision(4, 1);

            entity.Property(b => b.EconomyRate)
                  .HasPrecision(6, 2);

            entity.HasOne(b => b.Player)
                  .WithMany(p => p.BowlingPerformances)
                  .HasForeignKey(b => b.PlayerId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.Match)
                  .WithMany(m => m.BowlingPerformances)
                  .HasForeignKey(b => b.MatchId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Player Statistics (1:1 with Player)
        modelBuilder.Entity<PlayerStatistics>(entity =>
        {
            entity.Property(s => s.BattingAverage).HasPrecision(6, 2);
            entity.Property(s => s.StrikeRate).HasPrecision(6, 2);
            entity.Property(s => s.BowlingAverage).HasPrecision(6, 2);
            entity.Property(s => s.BowlingEconomy).HasPrecision(6, 2);

            entity.HasOne(s => s.Player)
                  .WithOne(p => p.Statistics)
                  .HasForeignKey<PlayerStatistics>(s => s.PlayerId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // AI Analyses
        modelBuilder.Entity<AIAnalysis>(entity =>
        {
            entity.HasOne(a => a.Player)
                  .WithMany(p => p.AIAnalyses)
                  .HasForeignKey(a => a.PlayerId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.User)
                  .WithMany(u => u.AIAnalyses)
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
