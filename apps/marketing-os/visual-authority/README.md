# Approved UI V4 visual authority fingerprints

These 96×64 PNG fingerprints are deterministic reduced representations of the user-approved conversation screenshots. They exist only to make deployed Preview visual QA fail closed against the actual approved sources without committing the full conversation images.

| Authority | Conversation filename | Original SHA-256 | Original dimensions | Fingerprint SHA-256 |
| --- | --- | --- | --- | --- |
| Main dashboard | `0D291464-3F4B-4AD2-B7BE-C5409EC56B4F.jpeg` | `db7bbd69b7646d4a81156c6c6b01d83a4f107302fd94fb3601ff02994f8fa2c6` | 1536×1024 | `90b73f693ed67d83ecb23968664cb8415a6263b85f1bb444b51c50bc9088bc16` |
| Performance/dashboard variant | `4C6D6E63-535F-4E43-BD88-FD10F31624DC.jpeg` | `609493e33900606862e9e73c413ddf2b9d10b32600a957b20d58351a9d56d738` | 1536×1024 | `8f734280f4d09bf4cd6ef28f11f94f89e4c2bf57706dec1e25a5cc817b8b4acc` |
| Duplicate confirmation | `0D291464-3F4B-4AD2-B7BE-C5409EC56B4F(1).jpeg` | same approved main-dashboard authority | 1536×1024 | same main fingerprint |

Derivation: RGB image resized to 96×64 using bilinear resampling. The deployed gate compares a 1536×1024 Preview viewport reduced in-browser to the same dimensions, while separately enforcing structural hierarchy and mobile requirements. The perceptual comparison intentionally tolerates truthful `UNAVAILABLE`/`UNVERIFIED` data states; it must never be used to justify fabricated metrics.
