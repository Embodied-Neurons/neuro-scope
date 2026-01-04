import inspect
import ast
import warnings
import textwrap

model_registry = {}
trainer_registry = {}
runner_registry = {}


def _check_train_fn(fn):
    src = inspect.getsource(fn)
    src = textwrap.dedent(src)
    tree = ast.parse(src)

    assigns = [n for n in ast.walk(tree) if isinstance(n, ast.Assign)]

    models_reassigned = any(
        any(isinstance(t, ast.Name) and t.id == "model" for t in a.targets)
        for a in assigns
    )

    trackers_reassigned = any(
        any(isinstance(t, ast.Name) and t.id == "tracker" for t in a.targets)
        for a in assigns
    )

    if models_reassigned and not trackers_reassigned:
        warnings.warn(
            f"In {fn.__qualname__!r}: you reassign `model` but never rebind `tracker`.  "
            "You’ll want `tracker = ActivationTracker(model)` after your new-model line.",
            stacklevel=4
        )


def _check_run_fn(fn):
    src = inspect.getsource(fn)
    src = textwrap.dedent(src)
    tree = ast.parse(src)

    assigns = [n for n in ast.walk(tree) if isinstance(n, ast.Assign)]

    models_reassigned = any(
        any(isinstance(t, ast.Name) and t.id == "model" for t in a.targets)
        for a in assigns
    )

    trackers_reassigned = any(
        any(isinstance(t, ast.Name) and t.id == "tracker" for t in a.targets)
        for a in assigns
    )

    if models_reassigned and not trackers_reassigned:
        warnings.warn(
            f"In {fn.__qualname__!r}: you reassign `model` but never rebind `tracker`. "
            "You likely need `tracker = ActivationTracker(model)` after replacing the model.",
            stacklevel=4
        )


def register_trainer(cls):
    train_fn = getattr(cls, "train", None)
    if train_fn:
        _check_train_fn(train_fn)

    trainer_registry["trainer"] = cls
    return cls


def register_model(cls):
    model_registry["model"] = cls
    return cls


def register_runner(fn):
    _check_run_fn(fn)
    runner_registry["runner"] = fn
    return fn
