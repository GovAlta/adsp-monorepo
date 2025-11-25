'use strict';

var immer = require('immer');
var Tours = require('../Tours.js');

/**
 * Migrates tours added or removed from the tours object
 */ const migrateTours = (storedTourState)=>{
    const storedTourNames = Object.keys(storedTourState.tours);
    const currentTourNames = Object.keys(Tours.tours);
    return immer.produce(storedTourState, (draft)=>{
        // Add new tours that don't exist in stored state
        currentTourNames.forEach((tourName)=>{
            if (!storedTourNames.includes(tourName)) {
                draft.tours[tourName] = {
                    currentStep: 0,
                    isCompleted: false,
                    tourType: undefined
                };
            }
        });
        // Remove tours that no longer exist in current tours
        storedTourNames.forEach((tourName)=>{
            if (!currentTourNames.includes(tourName)) {
                delete draft.tours[tourName];
            }
        });
    });
};

exports.migrateTours = migrateTours;
//# sourceMappingURL=migrations.js.map
