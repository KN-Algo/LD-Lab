#pragma once

#include <saucer/smartview.hpp>

/// Streaming API for Variable Table communication
/// 
/// Exposes the following JavaScript functions:
/// - subscribe_variable(varName: string): number
/// - unsubscribe_variable(subscriptionId: number): void
/// - get_variable(varName: string): VariableResponse
/// - get_all_variables(): AllVariablesResponse
/// - set_variable(varName: string, type: string, value: number): boolean
/// 
/// This module provides both on-demand and streaming access to the Variable Table
/// Additionally allows setting variable values from the frontend
class StreamingApi {
public:
    /// Register all streaming API functions with the webview
    /// @param webview Saucer webview instance
    static void registerStreamingApi(saucer::smartview& webview);
    
private:
    StreamingApi() = default;
};
