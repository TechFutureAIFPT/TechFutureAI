from __future__ import annotations

import math
from app.core.config import get_settings
from app.integrations.firebase_admin import get_firestore_client


def db():
    return get_firestore_client()


def vector_library(collection_name: str):
    return db().collection(collection_name)


def find_nearest_approved_exemplars(
    *,
    collection_name: str,
    query_vector: list[float],
    rubric_version: str,
    vector_index_version: str,
    limit: int,
    similarity_threshold: float,
) -> list[dict]:
    if get_settings().data_provider == "sqlite":
        if not query_vector or not all(math.isfinite(value) for value in query_vector):
            return []
        norm = math.sqrt(sum(value * value for value in query_vector))
        if norm == 0:
            return []
        records = []
        query = (vector_library(collection_name).where("status", "==", "approved")
                 .where("approved", "==", True).where("rubricVersion", "==", rubric_version)
                 .where("vectorIndexVersion", "==", vector_index_version))
        for snapshot in query.stream():
            data = snapshot.to_dict() or {}
            vector = data.get("embedding")
            if not isinstance(vector, list) or len(vector) != len(query_vector):
                continue
            if not all(isinstance(value, (int, float)) and math.isfinite(value) for value in vector):
                continue
            denominator = norm * math.sqrt(sum(value * value for value in vector))
            if denominator == 0:
                continue
            similarity = max(-1.0, min(1.0, sum(a * b for a, b in zip(query_vector, vector)) / denominator))
            if similarity >= similarity_threshold:
                records.append({**data, "_id": snapshot.id, "similarity": similarity})
        return sorted(records, key=lambda item: (-item["similarity"], item["_id"]))[:max(0, limit)]
    from google.cloud.firestore_v1.base_query import FieldFilter
    from google.cloud.firestore_v1.base_vector_query import DistanceMeasure
    from google.cloud.firestore_v1.vector import Vector

    query = (
        vector_library(collection_name)
        .where(filter=FieldFilter("status", "==", "approved"))
        .where(filter=FieldFilter("approved", "==", True))
        .where(filter=FieldFilter("rubricVersion", "==", rubric_version))
        .where(filter=FieldFilter("vectorIndexVersion", "==", vector_index_version))
    )
    vector_query = query.find_nearest(
        vector_field="embedding",
        query_vector=Vector(query_vector),
        limit=limit,
        distance_measure=DistanceMeasure.COSINE,
        distance_result_field="_vectorDistance",
        distance_threshold=max(0.0, 1.0 - similarity_threshold),
    )
    records: list[dict] = []
    for snapshot in vector_query.stream():
        data = snapshot.to_dict() or {}
        data["_id"] = snapshot.id
        distance = float(data.pop("_vectorDistance", 1.0) or 0.0)
        data["similarity"] = max(-1.0, min(1.0, 1.0 - distance))
        records.append(data)
    return records
