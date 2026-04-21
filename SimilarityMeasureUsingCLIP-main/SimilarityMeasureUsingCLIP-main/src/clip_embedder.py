"""OpenCLIP image embeddings (L2-normalized) for visual / semantic similarity."""

from __future__ import annotations

from typing import Optional

import numpy as np
import torch
from PIL import Image

import open_clip


class CLIPEmbedder:
    def __init__(
        self,
        model_name: str = "ViT-B-32",
        pretrained: str = "laion2b_s34b_b79k",
        device: Optional[torch.device] = None,
    ):
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            model_name, pretrained=pretrained, device=self.device
        )
        self.model.eval()

    @torch.inference_mode()
    def embed_pil(self, img: Image.Image) -> np.ndarray:
        t = self.preprocess(img.convert("RGB")).unsqueeze(0).to(self.device)
        z = self.model.encode_image(t)
        z = z / z.norm(dim=-1, keepdim=True)
        return z.squeeze(0).float().cpu().numpy().astype(np.float32)

    @torch.inference_mode()
    def embed_batch(self, images: list[Image.Image]) -> np.ndarray:
        if not images:
            return np.zeros((0, 512), dtype=np.float32)
        batch = torch.stack([self.preprocess(im.convert("RGB")) for im in images], dim=0).to(self.device)
        z = self.model.encode_image(batch)
        z = z / z.norm(dim=-1, keepdim=True)
        return z.float().cpu().numpy().astype(np.float32)
