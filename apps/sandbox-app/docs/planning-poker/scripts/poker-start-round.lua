-- Starts a new estimation round in a planning poker session.
-- Runner roles: default-roles-<realm> (every tenant user). Runs with the script service account.
-- Inputs: sessionId, roundId, storyTitle, storyUrl (optional), userId, userName
-- Output: the roundId of the started round.

local NAMESPACE = 'planning-poker'
local MAX_ID_LENGTH = 64
-- User IDs are emails, which can be up to 254 characters.
local MAX_USER_ID_LENGTH = 254
local MAX_NAME_LENGTH = 100
local MAX_TITLE_LENGTH = 200
local MAX_URL_LENGTH = 500

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
local round = {
  sessionId = sessionId,
  roundId = requireInput('roundId', MAX_ID_LENGTH),
  storyTitle = requireInput('storyTitle', MAX_TITLE_LENGTH),
  storyUrl = readInput('storyUrl', MAX_URL_LENGTH) or '',
  status = 'voting',
  startedById = requireInput('userId', MAX_USER_ID_LENGTH),
  startedByName = requireInput('userName', MAX_NAME_LENGTH),
}

-- The latest entry in the round series is the session's current round.
adsp.WriteValue(NAMESPACE, 'round-' .. sessionId, {
  value = round,
  context = { sessionId = sessionId },
  correlationId = round.roundId,
})

sendEvent('round-started', sessionId, round)

return round.roundId
