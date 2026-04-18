---
name: mmx-cli
description: Use mmx to generate text, images, video, speech, and music via the MiniMax AI platform. Use when the user wants to create media content, chat with MiniMax models, perform web search, or manage MiniMax API resources from the terminal.
---

# MiniMax CLI — Agent Skill Guide

Use `mmx` to generate text, images, video, speech, music, and perform web search via the MiniMax AI platform.

## Quick Reference

```bash
# Chat with MiniMax M2.7 (coding, reasoning)
mmx text chat --message "Review this code" --file src/app.ts --output json

# Generate music (unlimited free tier)
mmx music generate --prompt "Cinematic orchestral" --instrumental --out bgm.mp3

# Check quota
mmx quota show
```

## Key Models

| Model | Purpose |
|-------|---------|
| `MiniMax-M2.7` | General chat/coding |
| `MiniMax-M2.7-highspeed` | Faster responses |
| `music-2.6-free` | Unlimited music generation |
| `MiniMax-Hailuo-2.3` | Video generation |

## Quota

- Text generation: 1.5M tokens/month
- Music generation: Unlimited (music-2.6-free model)
- Video generation: Limited (check quota)

## Agent Flags

Always use for non-interactive contexts:
- `--non-interactive` — Fail fast on missing args
- `--quiet` — Clean stdout
- `--output json` — Machine-readable
