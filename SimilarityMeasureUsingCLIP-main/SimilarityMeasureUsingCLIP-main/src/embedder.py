"""L2-normalized image embeddings from a pretrained ResNet50 backbone."""

from __future__ import annotations

from typing import Optional

import torch
import torch.nn as nn
from torchvision import models, transforms


class ImageEmbedder(nn.Module):
    def __init__(self, device: Optional[torch.device] = None):
        super().__init__()
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        weights = models.ResNet50_Weights.IMAGENET1K_V2
        backbone = models.resnet50(weights=weights)
        self.features = nn.Sequential(*list(backbone.children())[:-1])
        self.eval().to(self.device)

        meta = getattr(weights, "meta", {}) or {}
        mean = meta.get("mean", (0.485, 0.456, 0.406))
        std = meta.get("std", (0.229, 0.224, 0.225))
        self.preprocess = transforms.Compose(
            [
                transforms.Resize(256, interpolation=transforms.InterpolationMode.BICUBIC),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=mean, std=std),
            ]
        )

    @torch.inference_mode()
    def embed_tensor(self, batch: torch.Tensor) -> torch.Tensor:
        """batch: (B, 3, 224, 224) on same device."""
        x = self.features(batch)
        x = torch.flatten(x, 1)
        x = torch.nn.functional.normalize(x, p=2, dim=1)
        return x

    @torch.inference_mode()
    def embed_pil(self, img) -> torch.Tensor:
        """Single PIL image -> (1, D) normalized embedding."""
        t = self.preprocess(img).unsqueeze(0).to(self.device)
        return self.embed_tensor(t)
