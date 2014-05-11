class RoutesController < ApplicationController
  def new
    @route = Route.new
    3.times do
      point = @route.points.build
    end
  end

  def create
    @route = Route.new(route_params)
    puts @route.inspect
    if @route.save
      flash[:notice] = "Successfully created route."
      redirect_to @route
    else
      render :action => 'new'
    end
  end

  def show
    @route = Route.find(params[:id])
  end

  private
    def route_params
      params.require(:route).permit(:name, points_attributes: [:lat, :long])
    end
end
