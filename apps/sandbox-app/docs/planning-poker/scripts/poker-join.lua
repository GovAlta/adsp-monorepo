-- Records a participant joining a planning poker session.
-- Runner roles: default-roles-<realm> (every tenant user). Runs with the script service account.
-- Inputs: sessionId, userId, userName
-- Output: the sessionId that was joined.

local NAMESPACE = 'planning-poker'
local MAX_ID_LENGTH = 64
-- User IDs are emails, which can be up to 254 characters.
local MAX_USER_ID_LENGTH = 254
local MAX_NAME_LENGTH = 100

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
  userName = requireInput('userName', MAX_NAME_LENGTH),
}

-- Participants are kept so people who join later can see who is in the session.
adsp.WriteValue(NAMESPACE, 'participants-' .. sessionId, {
  value = participant,
  context = { sessionId = sessionId },
  correlationId = sessionId,
})

sendEvent('participant-joined', sessionId, participant)

return sessionId
