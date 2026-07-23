import express from "express";
import multer from "multer";

// Import API handlers
import healthHandler from "../api/health";
import diagnosticHandler from "../api/diagnostic";
import chatHandler from "../api/chat";
import agendaHandler from "../api/agenda";
import memoryHandler from "../api/memory";
import undoHandler from "../api/action/undo";

import authStatusHandler from "../api/auth/status";
import authUrlHandler from "../api/auth/url";
import authCallbackHandler from "../api/auth/callback";
import authLogoutHandler from "../api/auth/logout";

import calendarListHandler from "../api/calendar/list";
import calendarCreateHandler from "../api/calendar/create";
import calendarUpdateHandler from "../api/calendar/update";
import calendarDeleteHandler from "../api/calendar/delete";

import tasksListHandler from "../api/tasks/list";
import tasksCreateHandler from "../api/tasks/create";
import tasksUpdateHandler from "../api/tasks/update";
import tasksDeleteHandler from "../api/tasks/delete";

export function createApp() {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage() });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes wrapper helper
  const wrap = (handler: any) => {
    return async (req: any, res: any) => {
      try {
        if (req.file) {
          req.files = req.files || {};
          req.files.audio = req.file;
        }
        await handler(req, res);
      } catch (err: any) {
        console.error("API error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: err?.message || "Internal server error" });
        }
      }
    };
  };

  // Mount API endpoints
  app.get("/api/health", wrap(healthHandler));
  app.get("/api/diagnostic", wrap(diagnosticHandler));
  app.post("/api/chat", upload.single("audio"), wrap(chatHandler));
  app.get("/api/agenda", wrap(agendaHandler));
  app.get("/api/memory", wrap(memoryHandler));
  app.post("/api/action/undo", wrap(undoHandler));

  app.get("/api/auth/status", wrap(authStatusHandler));
  app.get("/api/auth/url", wrap(authUrlHandler));
  app.get("/api/auth/callback", wrap(authCallbackHandler));
  app.post("/api/auth/logout", wrap(authLogoutHandler));

  app.get("/api/calendar/list", wrap(calendarListHandler));
  app.post("/api/calendar/create", wrap(calendarCreateHandler));
  app.put("/api/calendar/update", wrap(calendarUpdateHandler));
  app.delete("/api/calendar/delete", wrap(calendarDeleteHandler));

  app.get("/api/tasks/list", wrap(tasksListHandler));
  app.post("/api/tasks/create", wrap(tasksCreateHandler));
  app.put("/api/tasks/update", wrap(tasksUpdateHandler));
  app.delete("/api/tasks/delete", wrap(tasksDeleteHandler));

  return app;
}
