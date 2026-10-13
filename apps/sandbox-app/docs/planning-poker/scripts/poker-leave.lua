-- Records a participant leaving a planning poker session (closing the tab or leaving the board).
-- Runner roles: default-roles-<realm> (every tenant user). Runs with the script service account.
-- Inputs: sessionId, userId
-- Output: the sessionId that was left.
--
-- Leaving only removes the player from the table; running poker-join again brings them back.

local NAMESPACE = 'planning-poker'
local MAX_ID_LENGTH = 64
-- User IDs are emails, which can be up to 254 characters.
local MAX_USER_ID_LENGTH = 254

-- Script inputs arrive as a .NET dictionary; check the key first so a missing input reads as nil.
local function readInput(name, maxLength)
  if not inputs:ContainsKey(name) or inputs[name] == nil then
    return nil
  end
  local value = tostring(inputs[name])
  if string.len(value) > maxLength then
    error(name .. ' must be ' .. maxLength .. ' characters or less.')
  end
  return value
end

local function requireInput(name, maxLength)
  local value = readInput(name, maxLength)
  if value == nil or value == '' then
    error(name .. ' is required.')
  end
  return value
end

local function sendEvent(name, sessionId, payload)
  if not adsp.SendDomainEvent(NAMESPACE, name, sessionId, { sessionId = sessionId }, payload) then
    error('Failed to send ' .. name .. ' event.')
  end
end

local sessionId = requireInput('sessionId', MAX_ID_LENGTH)
local participant = {
  sessionId = sessionId,
  userId = requireInput('userId', MAX_USER_ID_LENGTH),
}

adsp.WriteValue(NAMESPACE, 'participants-' .. sessionId, {
  value = {
    sessionId = sessionId,
    userId = participant.userId,
    active = false,
    seenAt = os.time(),
  },
  context = { sessionId = sessionId },
  correlationId = sessionId,
})

sendEvent('participant-left', sessionId, participant)

return sessionId
